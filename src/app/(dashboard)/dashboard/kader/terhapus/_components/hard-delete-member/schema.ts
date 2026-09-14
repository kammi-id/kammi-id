import { z } from 'zod'

/**
 * Dua gerbang, gerbang kedua mengetik NIA (ADR 0021) — beda bentuk dari
 * `hardDeleteStrukturSchema`, yang mengetik `code` Struktur karena Struktur
 * tidak punya identitas setara NIA. Berkas sendiri, bukan impor dari
 * `delete-member-button`: folder ini unit ekspor sendiri, dan gerbangnya
 * jauh lebih berat — ireversibel, dan Akun ikut lenyap lewat cascade.
 */
export const hardDeleteMemberSchema = z.object({
  id: z.uuid('Kader yang dituju tidak dikenali.'),
  confirmSentence: z.string().min(1, 'Kalimat konfirmasi wajib diisi.'),
  confirmRegisterNumber: z.string().min(1, 'NIA wajib diisi.')
})

export type HardDeleteMemberInput = z.infer<typeof hardDeleteMemberSchema>

/**
 * Satu sumber kebenaran untuk kalimat yang harus diketik apa adanya — dipakai
 * dialog (yang menampilkannya) dan aksi (yang memvalidasinya ulang di
 * server) supaya keduanya tidak bisa diam-diam berbeda ejaan.
 */
export const confirmationSentenceFor = (name: string): string =>
  `Saya ingin menghapus ${name} selamanya`
