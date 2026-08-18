import { z } from 'zod'

/**
 * **No `confirmCode` here, and that is deliberate** (spec §8.4). Restoring does
 * not wear the sheet's type-the-`code` gate: it is not an action in the Struktur
 * sheet, it is the only action on a page whose entire contents are already
 * Terhapus, and it **restores** rather than removes.
 *
 * `slug` arrives only when the old one has since been claimed and a person
 * picked a new one — the dialog escalates from a confirmation into a form.
 */
export const restoreStrukturSchema = z.object({
  id: z.uuid('Struktur yang dituju tidak dikenali.'),
  slug: z.string().min(1, 'Slug wajib diisi.').optional()
})

export type RestoreStrukturInput = z.infer<typeof restoreStrukturSchema>
