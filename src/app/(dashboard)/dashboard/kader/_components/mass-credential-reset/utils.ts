import * as XLSX from 'xlsx'
import type { MassCredentialResetRow } from '~/db/query/mass-credential-reset'

/**
 * Menyamarkan sel yang diawali karakter yang bisa dibaca Excel/Sheets sebagai
 * pembuka formula (`=`, `+`, `-`, `@`) begitu CSV dibuka. NIA dan password di
 * baris ini terbit dari sistem sendiri dan tidak pernah butuh ini — hanya
 * Nama yang datang dari input bebas seorang Kader.
 */
const neutralizeFormulaPrefix = (value: string): string =>
  /^[\t\r ]*[=+\-@]/.test(value) ? `'${value}` : value

/**
 * Kolomnya `Nama, NIA, Password`, sebangun dengan `users.csv` yang sudah ada
 * (tiket 06). Memakai `XLSX.utils.sheet_to_csv` — dependensi yang sudah
 * dipakai `bulk-upload` — supaya escaping koma/kutip/baris-baru pada Nama
 * tidak perlu ditulis ulang tangan di sini.
 */
export const massCredentialRowsToCsv = (
  rows: MassCredentialResetRow[]
): string => {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Nama', 'NIA', 'Password'],
    ...rows.map((row) => [
      neutralizeFormulaPrefix(row.name),
      row.registerNumber,
      row.password
    ])
  ])
  return XLSX.utils.sheet_to_csv(sheet)
}

export const sanitizeMassCredentialFilename = (
  structureCode: string
): string => {
  const safeCode = structureCode
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `regenerasi-kredensial-${safeCode || 'struktur'}-${Date.now()}.csv`
}

/** Pemicu unduhan berkas di browser — sisi klien saja, tidak testable tanpa DOM. */
export const downloadMassCredentialCsv = (
  rows: MassCredentialResetRow[],
  structureCode: string
) => {
  const blob = new Blob([massCredentialRowsToCsv(rows)], {
    type: 'text/csv;charset=utf-8'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = sanitizeMassCredentialFilename(structureCode)
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
