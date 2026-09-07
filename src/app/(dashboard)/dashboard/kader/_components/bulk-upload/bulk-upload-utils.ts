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

/** Reads one entry's decoded text out of a STORED (uncompressed) ZIP buffer. */
export const readZipEntryText = (
  buf: Uint8Array,
  targetName: string
): string => {
  const dec = new TextDecoder()
  let pos = 0

  while (pos < buf.length - 4) {
    if (
      buf[pos] === 0x50 &&
      buf[pos + 1] === 0x4b &&
      buf[pos + 2] === 0x03 &&
      buf[pos + 3] === 0x04
    ) {
      const nameLen = r16(buf, pos + 26)
      const extraLen = r16(buf, pos + 28)
      const compSize = r32(buf, pos + 18)
      const name = dec.decode(buf.slice(pos + 30, pos + 30 + nameLen))
      const dataStart = pos + 30 + nameLen + extraLen
      if (name === targetName) {
        return dec.decode(buf.slice(dataStart, dataStart + compSize))
      }
      pos = dataStart + compSize
    } else if (
      buf[pos] === 0x50 &&
      buf[pos + 1] === 0x4b &&
      buf[pos + 2] === 0x01
    ) {
      break
    } else {
      pos++
    }
  }

  throw new Error(`Zip entry not found: ${targetName}`)
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

/**
 * OOXML tail elements of `CT_Worksheet` that must all come *after*
 * `dataValidations` (18.3.1.99, ECMA-376). SheetJS always writes
 * `ignoredErrors` (unless the `ignoreEC` write option is set, which we don't
 * set), and can write `pageMargins`/`pageSetup`/`hyperlinks` depending on
 * sheet options — so we anchor on whichever of these appears earliest in the
 * generated XML, rather than assuming only one of them is present.
 */
const WORKSHEET_TAIL_ANCHORS = [
  'pageMargins',
  'pageSetup',
  'hyperlinks',
  'ignoredErrors'
]

/** Inserts `injected` XML right before the earliest CT_Worksheet tail
 * element present in `xml`, falling back to right before `</worksheet>`. */
const insertBeforeWorksheetTail = (xml: string, injected: string): string => {
  let earliest = -1
  for (const tag of WORKSHEET_TAIL_ANCHORS) {
    const idx = xml.indexOf(`<${tag}`)
    if (idx !== -1 && (earliest === -1 || idx < earliest)) earliest = idx
  }
  if (earliest === -1) {
    return xml.replace('</worksheet>', injected + '</worksheet>')
  }
  return xml.slice(0, earliest) + injected + xml.slice(earliest)
}

/** Inserts `bookViews` XML right after `workbookPr` closes, whether it was
 * written as a self-closing tag (`<workbookPr .../>`) or an open/close pair
 * (`<workbookPr>...</workbookPr>`) — CT_Workbook requires `bookViews` to
 * follow `workbookPr` and precede `sheets`. */
const insertBookViewsAfterWorkbookPr = (
  xml: string,
  bookViewsXml: string
): string => {
  const selfClosing = /<workbookPr\b[^>]*\/>/
  const match = xml.match(selfClosing)
  if (match) {
    return xml.replace(selfClosing, match[0] + bookViewsXml)
  }
  if (xml.includes('</workbookPr>')) {
    return xml.replace('</workbookPr>', '</workbookPr>' + bookViewsXml)
  }
  return xml
}

/** Built-in OOXML number format id 49 = "@" (Text) — no `<numFmt>`
 * declaration required since it's a built-in id. */
const TEXT_NUM_FMT_ID = 49

/**
 * Finds the `cellXfs` index that a new "Text"-formatted style entry would
 * get if appended to `styles.xml` — i.e. the current `cellXfs count`, since
 * indices are 0-based and contiguous.
 */
const nextCellXfsIndex = (rawBuf: Uint8Array): number => {
  const stylesXml = readZipEntryText(rawBuf, 'xl/styles.xml')
  const cellXfsMatch = stylesXml.match(/<cellXfs count="(\d+)">/)
  if (!cellXfsMatch) {
    throw new Error('xl/styles.xml has no <cellXfs> section to extend')
  }
  return Number(cellXfsMatch[1])
}

/** Appends one `cellXfs` entry (built-in "Text" format) to `styles.xml`. */
const appendTextCellXf = (xml: string): string => {
  const bumped = xml.replace(
    /<cellXfs count="(\d+)">/,
    (_m, count: string) => `<cellXfs count="${Number(count) + 1}">`
  )
  const newXf = `<xf numFmtId="${TEXT_NUM_FMT_ID}" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>`
  return bumped.replace('</cellXfs>', newXf + '</cellXfs>')
}

/**
 * Forces the "No HP" column (5th column, `E`) of the Template sheet to the
 * "Text" number format at the column level, so Excel treats future keystrokes
 * in that column as literal text — without it, Excel eats leading `0`s and
 * treats `+62…` as a formula the moment someone types a phone number in.
 *
 * SheetJS Community Edition has no `!cols[i].style` API, so — same as the
 * data-validation dropdowns above — we hand-patch the raw XML: one new
 * `cellXfs` entry in `styles.xml` (built via `appendTextCellXf`), referenced
 * from the Template sheet's `<col>` definition for column 5. A column-level
 * `style` is the same mechanism Excel's own "Format Cells" applied to an
 * entire column uses, and it applies to cells that don't carry their own
 * explicit style — including both the header/example rows already in the
 * sheet and any row a user fills in later.
 */
const setNoHpColumnStyle = (xml: string, xfIndex: number): string =>
  xml.replace('<col min="5" max="5"', `<col min="5" max="5" style="${xfIndex}"`)

/**
 * Pure XML/ZIP-generation logic for the bulk-upload XLSX template. Returns
 * the finished workbook as a `Uint8Array` so it can be tested without a DOM
 * (no `document`/`URL.createObjectURL`). Use `generateTemplate` for the
 * browser download.
 */
export const generateTemplateBuffer = (): Uint8Array => {
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

  // Default print margins — also gives us a real `<pageMargins>` element to
  // anchor the `dataValidations` insertion before (see WORKSHEET_TAIL_ANCHORS
  // above); without `!margins` set, SheetJS omits the tag entirely.
  wsTemplate['!margins'] = {
    left: 0.7,
    right: 0.7,
    top: 0.75,
    bottom: 0.75,
    header: 0.3,
    footer: 0.3
  }

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

  // "No HP" (column 5, E) forced to Text format — computed against the
  // unpatched buffer since it reads the current `cellXfs` count from
  // `styles.xml` before we add a new entry to it.
  const noHpXfIndex = nextCellXfsIndex(new Uint8Array(rawBuf))

  const patched = patchXLSXBuffer(new Uint8Array(rawBuf), {
    'xl/worksheets/sheet2.xml': (xml) =>
      setNoHpColumnStyle(insertBeforeWorksheetTail(xml, dvXml), noHpXfIndex),
    'xl/styles.xml': appendTextCellXf,
    // Explicitly set activeTab=0 so Instruksi is shown on open
    'xl/workbook.xml': (xml) =>
      insertBookViewsAfterWorkbookPr(
        xml,
        '<bookViews><workbookView activeTab="0"/></bookViews>'
      )
  })

  return patched
}

/**
 * Generates the bulk-upload XLSX template and triggers a browser download.
 * Thin wrapper around `generateTemplateBuffer` — keep all XML-generation
 * logic in that pure function so it stays testable without a DOM.
 */
export const generateTemplate = () => {
  const patched = generateTemplateBuffer()

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
