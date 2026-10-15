import { z } from 'zod'

/**
 * **No typed confirmation here, and that is deliberate** — matching
 * `restoreStrukturSchema`. Restoring is the only action on a page whose
 * entire contents are already Terhapus, and it **restores** rather than
 * removes, so it does not wear the type-a-value friction Hapus Selamanya
 * does.
 */
export const restoreMemberSchema = z.object({
  id: z.uuid('Kader yang dituju tidak dikenali.')
})

export type RestoreMemberInput = z.infer<typeof restoreMemberSchema>
