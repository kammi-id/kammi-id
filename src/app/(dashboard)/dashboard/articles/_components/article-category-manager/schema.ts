import { z } from 'zod'

export const CategoryInputSchema = z.object({
  // not .uuid(): scope is still enforced via isArticleOrgInScope comparing
  // against the session's real org id; DB column itself remains a strict
  // uuid type
  organizationId: z.string().min(1),
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  slug: z
    .string()
    .min(1, 'Slug wajib diisi')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug hanya boleh huruf kecil, angka, dan tanda hubung'
    ),
  parentId: z.string().uuid().optional()
})

export type CategoryInput = z.infer<typeof CategoryInputSchema>
