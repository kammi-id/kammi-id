import * as XLSX from 'xlsx'
import { z } from 'zod'

export const BulkMemberRowSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  gender: z
    .string()
    .transform((v) => v.toLowerCase().trim())
    .refine(
      (v) => ['ikhwan', 'akhwat'].includes(v),
      'Harus "ikhwan" atau "akhwat"'
    ),
  yearOfEntry: z.coerce
    .number()
    .min(1998, 'Minimal 1998')
    .max(new Date().getFullYear()),
  phone: z.string().optional().nullable()
})

export type BulkMemberRow = z.infer<typeof BulkMemberRowSchema>

export type ParsedRow = {
  index: number
  raw: Record<string, unknown>
  data: Partial<BulkMemberRow>
  errors: Record<string, string>
  valid: boolean
}

export const parseXLSXFile = (file: File): Promise<ParsedRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: ''
        })

        const parsed: ParsedRow[] = rows.map((row, index) => {
          const normalized = {
            name: String(row['Nama'] ?? row['name'] ?? '').trim(),
            gender: String(row['Jenis Kelamin'] ?? row['gender'] ?? '').trim(),
            yearOfEntry:
              row['Tahun Masuk'] ?? row['yearOfEntry'] ?? row['year_of_entry'],
            phone: String(row['No HP'] ?? row['phone'] ?? '').trim() || null
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
      } catch (err) {
        reject(new Error('File tidak bisa dibaca. Pastikan format XLSX valid.'))
      }
    }
    reader.onerror = () => reject(new Error('Gagal membaca file.'))
    reader.readAsArrayBuffer(file)
  })
}

export const generateTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Nama', 'Jenis Kelamin', 'Tahun Masuk', 'No HP'],
    ['Contoh Nama', 'ikhwan', new Date().getFullYear(), '08123456789']
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, 'template-import-kader.xlsx')
}
