import { z } from 'zod'

/**
 * Input untuk `regenerateMassCredentialsAction` — lapis 2 dan 3 dari tiga
 * lapis konfirmasi tiket 06 tiba di sini sebagai string yang masih harus
 * dicocokkan; lapis 1 (jumlah terhitung) tidak lewat skema ini sama sekali
 * karena ia tidak pernah dikirim balik ke server, hanya ditampilkan.
 */
export const massCredentialResetSchema = z.object({
  organizationId: z.string().uuid(),
  confirmCode: z.string().min(1, 'Kode struktur wajib diisi.'),
  actorPassword: z.string().min(1, 'Password wajib diisi.')
})

export type MassCredentialResetInput = z.infer<typeof massCredentialResetSchema>
