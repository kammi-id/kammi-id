import { z } from 'zod'

/**
 * **Three fields, and all three are live** (spec §8.1).
 *
 * `code`, `type` and `parentId` are absent rather than disabled: they are
 * frozen forever for **everyone, Root included**, and a dead input reads as
 * "you lack permission" — which would be a lie, and PRODUCT.md says part of the
 * audience reads it literally. They appear on the page as an identity block
 * instead, so a posted value has nothing to land in.
 */
export const organizationProfileSchema = z.object({
  name: z.string().min(1, 'Nama struktur wajib diisi.'),
  slug: z.string().min(1, 'Slug wajib diisi.'),
  logo: z.string().optional()
})

export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>
