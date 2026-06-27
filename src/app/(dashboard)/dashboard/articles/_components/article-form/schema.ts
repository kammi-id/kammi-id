import { z } from 'zod'

export const ArticleInputSchema = z
  .object({
    // not .uuid(): scope is still enforced via isArticleOrgInScope comparing
    // against the session's real org id; DB column itself remains a strict
    // uuid type
    organizationId: z.string().min(1),
    type: z.enum(['page', 'blog']),
    title: z.string().min(1, 'Judul wajib diisi'),
    slug: z
      .string()
      .min(1, 'Permalink wajib diisi')
      .regex(
        /^[a-z0-9-]+$/,
        'Permalink hanya boleh huruf kecil, angka, dan tanda hubung'
      ),
    body: z.unknown(),
    featuredImage: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']),
    tags: z.array(z.string()).default([]),
    categoryId: z.string().uuid().optional(),
    publishedAt: z.string().datetime().optional()
  })
  .refine((data) => data.type !== 'blog' || Boolean(data.publishedAt), {
    message: 'Tanggal wajib diisi untuk artikel blog',
    path: ['publishedAt']
  })

export type ArticleInput = z.infer<typeof ArticleInputSchema>
