import { z } from 'zod'

/**
 * Both directions carry a `confirmCode`: the sheet gates every action behind
 * typing the Struktur's `code` (spec §8.2), and the gate is checked on the
 * server so it is a gate rather than a decoration — a Server Action is
 * reachable without the dialog that renders it.
 *
 * One schema for both, because deactivating and reactivating are **one rule in
 * two directions** (spec §6.4) and take exactly the same input. Splitting it
 * would state a difference that does not exist.
 */
export const strukturKeadaanSchema = z.object({
  id: z.uuid('Struktur yang dituju tidak dikenali.'),
  confirmCode: z.string().min(1, 'Kode struktur wajib diisi.')
})

export type StrukturKeadaanInput = z.infer<typeof strukturKeadaanSchema>
