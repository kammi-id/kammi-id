import { z } from 'zod'

/**
 * Same shape as the Keadaan actions', and deliberately its own file rather than
 * an import: the two folders are separate exported units, and a schema shared
 * across them would make one of them own the other's input.
 */
export const deleteStrukturSchema = z.object({
  id: z.uuid('Struktur yang dihapus tidak dikenali.'),
  confirmCode: z.string().min(1, 'Kode struktur wajib diisi.')
})

export type DeleteStrukturInput = z.infer<typeof deleteStrukturSchema>
