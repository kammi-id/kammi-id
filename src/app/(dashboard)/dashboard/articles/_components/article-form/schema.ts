import { z } from 'zod'
import { isReservedStrukturPath } from '~/lib/struktur/reserved-paths'

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
    penulis: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']),
    tags: z.array(z.string()).default([]),
    categoryId: z.string().uuid().optional(),
    publishedAt: z.string().datetime().optional()
  })
  .refine((data) => data.type !== 'blog' || Boolean(data.publishedAt), {
    message: 'Tanggal wajib diisi untuk artikel blog',
    path: ['publishedAt']
  })
  // Tiket 09 (Halaman beralamat akar): Permalink Halaman disajikan sebagai
  // `/<slug>` — segmen tunggal langsung di bawah Situs Struktur (lihat
  // `[strukturSlug]/[slug]/page.tsx`). Kalau slug itu bertabrakan dengan
  // alamat milik sistem (`RESERVED_STRUKTUR_PATHS`), baris ini akan
  // tersimpan sukses tapi tidak akan PERNAH terbaca di alamatnya — Next.js
  // rute statis (mis. `/berita`) menang, atau proxy sudah memotong path itu
  // duluan. Ditolak di sini, saat simpan, bukan diam-diam gagal di jalur
  // baca. Hanya berlaku untuk `type: 'page'` — permalink Berita (`blog`)
  // hidup di bawah `/berita/<tahun>/<bulan>/<slug>` dan tidak pernah
  // bertabrakan dengan segmen akar ini.
  .superRefine((data, ctx) => {
    if (data.type === 'page' && isReservedStrukturPath(data.slug)) {
      ctx.addIssue({
        code: 'custom',
        path: ['slug'],
        message: `Permalink "/${data.slug}" dipakai sistem — pilih alamat lain.`
      })
    }
  })

export type ArticleInput = z.infer<typeof ArticleInputSchema>
