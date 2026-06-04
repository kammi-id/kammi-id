import * as XLSX from 'xlsx'
import { z } from 'zod'

// ─── Schema ───────────────────────────────────────────────────────────────────

const booleanFromCell = z.preprocess((val) => {
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val !== 0
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim()
    return (
      lower === 'ya' || lower === 'yes' || lower === 'true' || lower === '1'
    )
  }
  return false
}, z.boolean().default(false))

export const BulkMemberRowSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  gender: z
    .string()
    .transform((v) => v.toLowerCase().trim())
    .refine(
      (v) => ['ikhwan', 'akhwat'].includes(v),
      'Harus "ikhwan" atau "akhwat"'
    ),
  status: z
    .string()
    .transform((v) => v.toLowerCase().trim().replace(/\s+/g, ''))
    .refine(
      (v) => ['ab1', 'ab2', 'ab3'].includes(v),
      'Harus "ab1", "ab2", atau "ab3"'
    )
    .default('ab1'),
  yearOfEntry: z.coerce
    .number()
    .min(1998, 'Minimal 1998')
    .max(new Date().getFullYear()),
  phone: z.string().optional().nullable(),
  isCertifiedMentor: booleanFromCell,
  isCertifiedInstructor: booleanFromCell
})

export type BulkMemberRow = z.infer<typeof BulkMemberRowSchema>

export type ParsedRow = {
  index: number
  raw: Record<string, unknown>
  data: Partial<BulkMemberRow>
  errors: Record<string, string>
  valid: boolean
}

// ─── Parser ───────────────────────────────────────────────────────────────────

export const parseXLSXFile = (file: File): Promise<ParsedRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        // Accept either the first sheet or the one named "Template"
        const sheetName =
          workbook.SheetNames.find((n) => n === 'Template') ??
          workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: ''
        })

        const parsed: ParsedRow[] = rows.map((row, index) => {
          const normalized = {
            name: String(row['Nama'] ?? row['name'] ?? '').trim(),
            gender: String(row['Jenis Kelamin'] ?? row['gender'] ?? '').trim(),
            status: String(
              row['Jenjang Pengkaderan'] ?? row['status'] ?? 'ab1'
            ).trim(),
            yearOfEntry:
              row['Tahun Masuk KAMMI'] ??
              row['Tahun Masuk'] ??
              row['yearOfEntry'] ??
              row['year_of_entry'],
            phone: String(row['No HP'] ?? row['phone'] ?? '').trim() || null,
            isCertifiedMentor:
              row['Pemandu'] ?? row['isCertifiedMentor'] ?? false,
            isCertifiedInstructor:
              row['Instruktur'] ?? row['isCertifiedInstructor'] ?? false
          }

          const result = BulkMemberRowSchema.safeParse(normalized)

          if (result.success) {
            return {
              index,
              raw: normalized,
              data: result.data,
              errors: {},
              valid: true
            }
          }

          const errors: Record<string, string> = {}
          for (const [field, msgs] of Object.entries(
            result.error.flatten().fieldErrors
          )) {
            errors[field] = (msgs as string[])[0]
          }

          return {
            index,
            raw: normalized,
            data: normalized as Partial<BulkMemberRow>,
            errors,
            valid: false
          }
        })

        resolve(parsed)
      } catch {
        reject(new Error('File tidak bisa dibaca. Pastikan format XLSX valid.'))
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file.'))
    reader.readAsArrayBuffer(file)
  })
}

// ─── ZIP Patcher (inject data validation without premium SheetJS) ─────────────
// SheetJS Community Edition (free) does not support writing data validation.
// XLSX files are ZIP archives with STORED (uncompressed) entries.
// We patch the raw buffer post-generation to inject <dataValidations> XML.

const makeCRC32Table = (): Uint32Array => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
}
const CRC32T = makeCRC32Table()
const crc32 = (d: Uint8Array): number => {
  let c = 0xffffffff
  for (const b of d) c = (c >>> 8) ^ CRC32T[(c ^ b) & 0xff]
  return (c ^ 0xffffffff) >>> 0
}
const r16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8)
const r32 = (b: Uint8Array, o: number) =>
  (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0
const w16 = (b: Uint8Array, v: number, o: number) => {
  b[o] = v & 0xff
  b[o + 1] = (v >> 8) & 0xff
}
const w32 = (b: Uint8Array, v: number, o: number) => {
  b[o] = v & 0xff
  b[o + 1] = (v >> 8) & 0xff
  b[o + 2] = (v >> 16) & 0xff
  b[o + 3] = (v >> 24) & 0xff
}

/** Patches XML files inside a STORED (uncompressed) XLSX ZIP buffer. */
const patchXLSXBuffer = (
  orig: Uint8Array,
  patches: Record<string, (xml: string) => string>
): Uint8Array => {
  const dec = new TextDecoder()
  const enc = new TextEncoder()
  type Entry = { name: string; data: Uint8Array }
  const entries: Entry[] = []
  let pos = 0

  while (pos < orig.length - 4) {
    if (
      orig[pos] === 0x50 &&
      orig[pos + 1] === 0x4b &&
      orig[pos + 2] === 0x03 &&
      orig[pos + 3] === 0x04
    ) {
      const nameLen = r16(orig, pos + 26)
      const extraLen = r16(orig, pos + 28)
      const compSize = r32(orig, pos + 18)
      const name = dec.decode(orig.slice(pos + 30, pos + 30 + nameLen))
      const dataStart = pos + 30 + nameLen + extraLen
      let data = orig.slice(dataStart, dataStart + compSize)
      if (patches[name]) data = enc.encode(patches[name](dec.decode(data)))
      entries.push({ name, data })
      pos = dataStart + compSize
    } else if (
      orig[pos] === 0x50 &&
      orig[pos + 1] === 0x4b &&
      orig[pos + 2] === 0x01
    ) {
      break
    } else {
      pos++
    }
  }

  const parts: Uint8Array[] = []
  const offsets: number[] = []

  for (const e of entries) {
    const nb = enc.encode(e.name)
    const h = new Uint8Array(30 + nb.length)
    w32(h, 0x04034b50, 0)
    w16(h, 20, 4)
    w32(h, crc32(e.data), 14)
    w32(h, e.data.length, 18)
    w32(h, e.data.length, 22)
    w16(h, nb.length, 26)
    h.set(nb, 30)
    offsets.push(parts.reduce((a, p) => a + p.length, 0))
    parts.push(h, e.data)
  }

  const cdStart = parts.reduce((a, p) => a + p.length, 0)
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    const nb = enc.encode(e.name)
    const cd = new Uint8Array(46 + nb.length)
    w32(cd, 0x02014b50, 0)
    w16(cd, 20, 4)
    w16(cd, 20, 6)
    w32(cd, crc32(e.data), 16)
    w32(cd, e.data.length, 20)
    w32(cd, e.data.length, 24)
    w16(cd, nb.length, 28)
    w32(cd, offsets[i], 42)
    cd.set(nb, 46)
    parts.push(cd)
  }

  const cdEnd = parts.reduce((a, p) => a + p.length, 0)
  const eocd = new Uint8Array(22)
  w32(eocd, 0x06054b50, 0)
  w16(eocd, entries.length, 8)
  w16(eocd, entries.length, 10)
  w32(eocd, cdEnd - cdStart, 12)
  w32(eocd, cdStart, 16)
  parts.push(eocd)

  const total = parts.reduce((a, p) => a + p.length, 0)
  const result = new Uint8Array(total)
  let off = 0
  for (const p of parts) {
    result.set(p, off)
    off += p.length
  }
  return result
}

// ─── Template Generator ───────────────────────────────────────────────────────

export const generateTemplate = () => {
  const currentYear = new Date().getFullYear()

  // ── Sheet 1: Instruksi (default/active sheet) ──────────────────────────────
  const rows: unknown[][] = [
    // [0] Title (akan di-merge A1:D1)
    ['📋  PANDUAN IMPORT DATA KADER — KAMMI.id', '', '', ''],
    // [1] spacer
    [''],
    // [2] Navigasi
    ['➡️  Buka sheet "Template" (tab di bawah) untuk mengisi data kader.'],
    ['    Satu baris di sheet Template = satu kader.'],
    // [3] spacer
    [''],
    // [4] Section header (akan di-merge A6:D6)
    ['  PANDUAN KOLOM', '', '', ''],
    // [5] Table header
    ['Kolom', 'Wajib?', 'Nilai yang Diterima', 'Contoh'],
    // [6-12] Table rows
    ['Nama', '✓  Ya', 'Teks bebas — nama lengkap kader', 'Siti Rahmawati'],
    [
      'Jenis Kelamin',
      '✓  Ya',
      'ikhwan  atau  akhwat  (gunakan dropdown)',
      'ikhwan'
    ],
    [
      'Jenjang Pengkaderan',
      '✓  Ya',
      'ab1  atau  ab2  atau  ab3  (gunakan dropdown)',
      'ab3'
    ],
    [
      'Tahun Masuk KAMMI',
      '✓  Ya',
      `Angka tahun antara 1998 dan ${currentYear}`,
      String(currentYear)
    ],
    ['No HP', '—  Tidak', 'Nomor telepon, boleh dikosongkan', '08123456789'],
    ['Pemandu', '—  Tidak', 'ya  atau  tidak  (gunakan dropdown)', 'tidak'],
    ['Instruktur', '—  Tidak', 'ya  atau  tidak  (gunakan dropdown)', 'tidak'],
    // [13] spacer
    [''],
    // [14] Notes header (akan di-merge A15:D15)
    ['  📌  CATATAN PENTING', '', '', ''],
    // [15-18] Notes
    [
      '  1.',
      'Jangan ubah atau hapus baris header (baris pertama) di sheet Template.'
    ],
    [
      '  2.',
      'Kolom dengan dropdown hanya menerima nilai yang tertera. Nilai lain akan ditolak saat import.'
    ],
    [
      '  3.',
      'Hapus atau timpa baris contoh (baris kedua) di sheet Template sebelum mengisi data sungguhan.'
    ],
    [
      '  4.',
      'Kolom No HP, Pemandu, dan Instruktur boleh dikosongkan — sistem akan mengisi dengan nilai default.'
    ]
  ]

  const wsInstruksi = XLSX.utils.aoa_to_sheet(rows)

  // Merge cells
  wsInstruksi['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // A1:D1  — title
    { s: { r: 5, c: 0 }, e: { r: 5, c: 3 } }, // A6:D6  — section 1
    { s: { r: 14, c: 0 }, e: { r: 14, c: 3 } } // A15:D15 — section 2
  ]

  // Column widths
  wsInstruksi['!cols'] = [
    { wch: 24 }, // A – Kolom / note number
    { wch: 12 }, // B – Wajib? / note body
    { wch: 52 }, // C – Nilai yang diterima
    { wch: 22 } //  D – Contoh
  ]

  // Row heights
  wsInstruksi['!rows'] = [
    { hpt: 32 }, // 0 title
    { hpt: 6 }, //  1 spacer
    { hpt: 16 }, // 2 nav
    { hpt: 16 }, // 3 nav
    { hpt: 6 }, //  4 spacer
    { hpt: 20 }, // 5 section header
    { hpt: 18 }, // 6 table header
    { hpt: 16 }, // 7-13 table rows
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 16 },
    { hpt: 6 }, //  14 spacer — wait, this is actually row index 13 (0-based)
    { hpt: 20 }, // 15 (index 14) notes header
    { hpt: 16 }, // 16 note 1
    { hpt: 16 }, // 17 note 2
    { hpt: 16 }, // 18 note 3
    { hpt: 16 } //  19 note 4
  ]

  // ── Sheet 2: Template ──────────────────────────────────────────────────────
  const wsTemplate = XLSX.utils.aoa_to_sheet([
    [
      'Nama',
      'Jenis Kelamin',
      'Jenjang Pengkaderan',
      'Tahun Masuk KAMMI',
      'No HP',
      'Pemandu',
      'Instruktur'
    ],
    [
      'Contoh Nama',
      'ikhwan',
      'ab1',
      currentYear,
      '08123456789',
      'tidak',
      'tidak'
    ]
  ])

  wsTemplate['!cols'] = [
    { wch: 32 }, // Nama
    { wch: 16 }, // Jenis Kelamin
    { wch: 22 }, // Jenjang Pengkaderan
    { wch: 18 }, // Tahun Masuk KAMMI
    { wch: 18 }, // No HP
    { wch: 12 }, // Pemandu
    { wch: 12 } //  Instruktur
  ]

  wsTemplate['!rows'] = [
    { hpt: 20 }, // header row
    { hpt: 16 } //  example row
  ]

  // ── Workbook ───────────────────────────────────────────────────────────────
  // Instruksi first → index 0 → active sheet by default (OOXML activeTab=0)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsInstruksi, 'Instruksi')
  XLSX.utils.book_append_sheet(wb, wsTemplate, 'Template')

  // Write to buffer so we can patch data validations
  const rawBuf = XLSX.write(wb, {
    type: 'array',
    bookType: 'xlsx'
  }) as Uint8Array

  // ── Patch: inject data validation dropdowns into Template sheet ────────────
  // Template sheet = sheet2.xml (Instruksi is sheet1.xml)
  const dvXml =
    '<dataValidations count="4">' +
    '<dataValidation type="list" sqref="B2:B1001" showDropDown="0"' +
    ' showErrorMessage="1" showInputMessage="1"' +
    ' promptTitle="Jenis Kelamin" prompt="Pilih ikhwan atau akhwat."' +
    ' errorStyle="stop" errorTitle="Nilai tidak valid"' +
    ' error="Gunakan dropdown: ikhwan atau akhwat.">' +
    '<formula1>&quot;ikhwan,akhwat&quot;</formula1></dataValidation>' +
    '<dataValidation type="list" sqref="C2:C1001" showDropDown="0"' +
    ' showErrorMessage="1" showInputMessage="1"' +
    ' promptTitle="Jenjang Pengkaderan" prompt="Pilih ab1, ab2, atau ab3."' +
    ' errorStyle="stop" errorTitle="Nilai tidak valid"' +
    ' error="Gunakan dropdown: ab1, ab2, atau ab3.">' +
    '<formula1>&quot;ab1,ab2,ab3&quot;</formula1></dataValidation>' +
    '<dataValidation type="list" sqref="F2:F1001" showDropDown="0"' +
    ' showErrorMessage="1" showInputMessage="1"' +
    ' promptTitle="Pemandu" prompt="ya jika bersertifikat Pemandu, tidak jika tidak."' +
    ' errorStyle="stop" errorTitle="Nilai tidak valid"' +
    ' error="Gunakan dropdown: ya atau tidak.">' +
    '<formula1>&quot;ya,tidak&quot;</formula1></dataValidation>' +
    '<dataValidation type="list" sqref="G2:G1001" showDropDown="0"' +
    ' showErrorMessage="1" showInputMessage="1"' +
    ' promptTitle="Instruktur" prompt="ya jika bersertifikat Instruktur, tidak jika tidak."' +
    ' errorStyle="stop" errorTitle="Nilai tidak valid"' +
    ' error="Gunakan dropdown: ya atau tidak.">' +
    '<formula1>&quot;ya,tidak&quot;</formula1></dataValidation>' +
    '</dataValidations>'

  const patched = patchXLSXBuffer(new Uint8Array(rawBuf), {
    'xl/worksheets/sheet2.xml': (xml) =>
      xml.replace('</worksheet>', dvXml + '</worksheet>'),
    // Explicitly set activeTab=0 so Instruksi is shown on open
    'xl/workbook.xml': (xml) =>
      xml.replace(
        '<workbookPr',
        '<bookViews><workbookView activeTab="0"/></bookViews><workbookPr'
      )
  })

  // ── Trigger download ───────────────────────────────────────────────────────
  const blob = new Blob([new Uint8Array(patched)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template-import-kader.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
