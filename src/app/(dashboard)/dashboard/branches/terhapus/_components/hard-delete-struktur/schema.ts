import { z } from 'zod'

/**
 * Sama bentuknya dengan `deleteStrukturSchema` — gerbang ketik-`code` yang
 * sama untuk aksi yang jauh lebih berbahaya (ADR 0019: barisnya sungguhan
 * lenyap, Akun kepengurusan ikut). Berkas sendiri, bukan impor: folder ini
 * unit ekspor sendiri, terpisah dari `delete-struktur` di rute lain.
 */
export const hardDeleteStrukturSchema = z.object({
  id: z.uuid('Struktur yang dituju tidak dikenali.'),
  confirmCode: z.string().min(1, 'Kode struktur wajib diisi.')
})

export type HardDeleteStrukturInput = z.infer<typeof hardDeleteStrukturSchema>
