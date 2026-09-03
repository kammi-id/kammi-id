import { z } from 'zod'

/**
 * Dua gerbang, bukan satu — beda dari `deleteStrukturSchema`, yang cuma
 * mengetik `code`. Hapus Selamanya jauh lebih berbahaya (ADR 0019: barisnya
 * sungguhan lenyap, Akun kepengurusan ikut), jadi ia menuntut kode STRUKTUR
 * dan kalimat pengakuan yang menyebut namanya, dua-duanya cocok literal.
 * Berkas sendiri, bukan impor dari `delete-struktur`: folder ini unit ekspor
 * sendiri, dan gerbangnya memang berbeda bentuk.
 */
export const hardDeleteStrukturSchema = z.object({
  id: z.uuid('Struktur yang dituju tidak dikenali.'),
  confirmCode: z.string().min(1, 'Kode struktur wajib diisi.'),
  confirmSentence: z.string().min(1, 'Kalimat konfirmasi wajib diisi.')
})

export type HardDeleteStrukturInput = z.infer<typeof hardDeleteStrukturSchema>

/**
 * Satu sumber kebenaran untuk kalimat yang harus diketik apa adanya — dipakai
 * dialog (yang menampilkannya) dan aksi (yang memvalidasinya ulang di
 * server) supaya keduanya tidak bisa diam-diam berbeda ejaan.
 */
export const confirmationSentenceFor = (name: string): string =>
  `Saya ingin menghapus ${name}`
