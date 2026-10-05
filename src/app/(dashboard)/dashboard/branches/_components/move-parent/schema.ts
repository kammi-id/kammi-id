import { z } from 'zod'

/**
 * Both inputs carry a `confirmCode`: the sheet gates every action behind typing
 * the Struktur's `code` (spec §8.2), and the gate is checked on the server so
 * it is a gate rather than a decoration.
 */
export const moveParentSchema = z.object({
  id: z.uuid('Struktur yang dipindahkan tidak dikenali.'),
  newParentId: z.uuid('Struktur induk tujuan tidak dikenali.'),
  confirmCode: z.string().min(1, 'Kode struktur wajib diisi.')
})

/**
 * The bulk shortcut takes no destination. It is not an omission: every
 * Komisariat of a Daerah sits in that Daerah's own PW, and the PW is always a
 * legal induk for all of them — so offering a picker would be offering a
 * question whose answer is already known (spec §6.2).
 */
export const moveChildrenToParentSchema = z.object({
  id: z.uuid('Struktur yang dikosongkan tidak dikenali.'),
  confirmCode: z.string().min(1, 'Kode struktur wajib diisi.')
})

export type MoveParentInput = z.infer<typeof moveParentSchema>
export type MoveChildrenToParentInput = z.infer<
  typeof moveChildrenToParentSchema
>
