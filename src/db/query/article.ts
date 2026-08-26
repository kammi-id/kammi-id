import { db } from '~/db/db'
import { article } from '~/db/schema/article.sql'
import { organization } from '~/db/schema/organization.sql'
import { articleCategory } from '~/db/schema/article-category.sql'
import { organizationNotDeleted } from '~/db/query/organization'
import { terbitCutoffForQuery } from '~/lib/publikasi/tanggal-terbit'
import { eq, and, ilike, desc, lte, sql } from 'drizzle-orm'

export type ArticleType = 'page' | 'blog'
export type ArticleStatus = 'draft' | 'published' | 'archived'

export type BeritaPreviewItem = {
  id: string
  title: string
  slug: string
  featuredImage: string | null
  publishedAt: Date
}

/**
 * Top-N Berita preview for one Struktur's homepage (ticket 04, spec
 * "Template Situs" — 12 latest for the Struktur's own Situs). Deliberately
 * minimal: the full paginated `/berita` archive — `organization` JOIN,
 * combined-count pagination, cross-Struktur Berita Jaringan, and the stable
 * sort/index work spec "Pembacaan data" calls for — is a later ticket's job.
 *
 * The Terbit comparison happens in SQL via `now() AT TIME ZONE 'Asia/Jakarta'`
 * — converting Postgres' own `now()` (a `timestamptz`, a real instant) into
 * the Jakarta *wall-clock* reading of that instant, the same representation
 * `published_at` itself is stored in (`timestamp` with no zone — ADR 0014).
 * Comparing two real UTC instants instead, or applying the process's own
 * local timezone via JS `Date` methods, is exactly the "06.00 WIB terlempar
 * ke Desember tahun sebelumnya" bug that ADR warns about.
 */
export const listLatestBeritaForOrg = async (
  organizationId: string,
  limit = 12
): Promise<BeritaPreviewItem[]> => {
  const rows = await db
    .select({
      id: article.id,
      title: article.title,
      slug: article.slug,
      featuredImage: article.featuredImage,
      publishedAt: article.publishedAt
    })
    .from(article)
    .where(
      and(
        eq(article.organizationId, organizationId),
        eq(article.type, 'blog'),
        eq(article.status, 'published'),
        sql`${article.publishedAt} <= (now() AT TIME ZONE 'Asia/Jakarta')`,
        organizationNotDeleted(article.organizationId)
      )
    )
    .orderBy(desc(article.publishedAt), desc(article.id))
    .limit(limit)

  return rows.filter((r): r is BeritaPreviewItem => r.publishedAt !== null)
}

// ── Ticket 07 — arsip Berita per Situs Struktur ──────────────────────────────
//
// Sengaja fungsi TERPISAH dari `listLatestBeritaForOrg` di atas (bukan
// generalisasi satu fungsi dengan parameter limit/page), dan sengaja tidak
// menyentuh `articleQuery.listForOrg`/`getBlogArticleBySlug` — tiket lain
// (10) yang paralel juga menyentuh berkas ini, jadi blok ini berdiri sendiri
// supaya mudah digabung manual.

export type BeritaArsipItem = {
  id: string
  title: string
  slug: string
  featuredImage: string | null
  publishedAt: Date
  organization: {
    id: string
    name: string
    slug: string
  }
  category: {
    id: string
    name: string
  } | null
}

export type BeritaArsipPage = {
  items: BeritaArsipItem[]
  totalCount: number
  totalPages: number
}

/** Spec "Template Situs": 48 Berita per halaman arsip `/berita`. */
export const BERITA_ARSIP_PAGE_SIZE = 48

/**
 * Arsip kronologis PENUH satu Struktur, berpaginasi (spec "Pembacaan data").
 * Tiga hal yang tiket ini secara eksplisit minta beda dari
 * `listLatestBeritaForOrg`:
 *
 * 1. **Total halaman dalam query yang sama** — lewat window function
 *    `count(*) over()`, bukan roundtrip `COUNT(*)` kedua yang terpisah.
 * 2. **Identitas Struktur lewat JOIN** — `organization` disambungkan di
 *    query yang sama, bukan ditempelkan per baris di kode pemanggil (N+1).
 * 3. **Label Kategori** — `LEFT JOIN article_category` (opsional; artikel
 *    boleh tak berkategori), disajikan sebagai label saja — tanpa tautan,
 *    tanpa halaman arsip per kategori (di luar cakupan tiket ini).
 *
 * Urutan `publishedAt DESC, id DESC` — `id` (uuidv7, terurut waktu) sebagai
 * pemecah seri yang stabil ketika dua Berita berbagi `publishedAt` yang
 * sama persis, supaya berpindah halaman tidak pernah melewatkan atau
 * menduakan baris.
 *
 * Catatan window function: `count(*) over()` menghitung seluruh baris yang
 * lolos WHERE — dihitung SEBELUM LIMIT/OFFSET diterapkan. Tapi kalau `page`
 * yang diminta melampaui halaman terakhir, OFFSET menghabiskan semua baris
 * dan hasilnya nol baris — nilai count itu sendiri ikut hilang karena tidak
 * ada baris yang membawanya pulang. Pemanggil (halaman `/berita`)
 * membedakan dua nol: nol baris DAN `page` > 1 berarti nomor halaman di
 * luar jangkauan (⇒ `notFound()`); nol baris di `page` 1 berarti Struktur
 * ini memang belum punya Berita Terbit sama sekali.
 */
export const listBeritaArsipForOrg = async (
  organizationId: string,
  page = 1,
  pageSize: number = BERITA_ARSIP_PAGE_SIZE
): Promise<BeritaArsipPage> => {
  const safePage = Math.max(1, Math.trunc(page) || 1)
  const offset = (safePage - 1) * pageSize

  const rows = await db
    .select({
      id: article.id,
      title: article.title,
      slug: article.slug,
      featuredImage: article.featuredImage,
      publishedAt: article.publishedAt,
      organizationId: organization.id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      categoryId: articleCategory.id,
      categoryName: articleCategory.name,
      totalCount: sql<number>`count(*) over()`.mapWith(Number)
    })
    .from(article)
    .innerJoin(organization, eq(article.organizationId, organization.id))
    .leftJoin(articleCategory, eq(article.categoryId, articleCategory.id))
    .where(
      and(
        eq(article.organizationId, organizationId),
        eq(article.type, 'blog'),
        eq(article.status, 'published'),
        lte(article.publishedAt, terbitCutoffForQuery()),
        organizationNotDeleted(article.organizationId)
      )
    )
    .orderBy(desc(article.publishedAt), desc(article.id))
    .limit(pageSize)
    .offset(offset)

  const totalCount = rows[0]?.totalCount ?? 0
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize)

  const items: BeritaArsipItem[] = rows
    .filter((r): r is typeof r & { publishedAt: Date } => r.publishedAt !== null)
    .map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      featuredImage: r.featuredImage,
      publishedAt: r.publishedAt,
      organization: {
        id: r.organizationId,
        name: r.organizationName,
        slug: r.organizationSlug
      },
      category: r.categoryId
        ? { id: r.categoryId, name: r.categoryName as string }
        : null
    }))

  return { items, totalCount, totalPages }
}

export const isArticleOrgInScope = (
  user: { role: string; connectedOrganizationId?: string | null },
  articleOrgId: string
): boolean => {
  if (user.role === 'root') return true
  if (user.role === 'humas')
    return (
      Boolean(user.connectedOrganizationId) &&
      user.connectedOrganizationId === articleOrgId
    )
  return false
}

export type ArticleListFilters = {
  search?: string
  status?: ArticleStatus
  categoryId?: string
}

export const articleQuery = {
  create: async (values: typeof article.$inferInsert) => {
    const [created] = await db.insert(article).values(values).returning()
    return created
  },

  update: async (id: string, values: Partial<typeof article.$inferInsert>) => {
    const [updated] = await db
      .update(article)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(article.id, id))
      .returning()
    return updated
  },

  delete: async (id: string) => {
    const [deleted] = await db
      .delete(article)
      .where(eq(article.id, id))
      .returning()
    return deleted
  },

  getById: async (id: string) => {
    const [row] = await db
      .select()
      .from(article)
      .where(
        and(eq(article.id, id), organizationNotDeleted(article.organizationId))
      )
      .limit(1)
    return row
  },

  // Spec §7 lists `article.organization_id` among the seven references, and
  // spec §3 klausa 3 lets Publikasi dangle rather than block a deletion — so
  // Artikel of a Terhapus Struktur do exist, and the rule that hides them is
  // installed here even though no public surface reads them yet (spec §7.2).
  listForOrg: async (organizationId: string, filters: ArticleListFilters) => {
    const conditions = [
      eq(article.organizationId, organizationId),
      organizationNotDeleted(article.organizationId)
    ]
    if (filters.status) conditions.push(eq(article.status, filters.status))
    if (filters.categoryId)
      conditions.push(eq(article.categoryId, filters.categoryId))
    if (filters.search)
      conditions.push(ilike(article.title, `%${filters.search}%`))

    return await db
      .select()
      .from(article)
      .where(and(...conditions))
      .orderBy(desc(article.updatedAt))
  },

  // Ticket 05 (permalink Berita). Sengaja TIDAK menyaring `status` atau
  // `publishedAt` di sini — Terbit (dinyatakan terbit DAN tanggalnya sudah
  // lewat, ADR 0014) adalah aturan yang butuh helper zona waktu terpusat
  // (`src/lib/publikasi/tanggal-terbit.ts`), dan menegakkannya lewat SQL
  // `now()` mentah akan diam-diam menulis ulang aturan itu dalam dialek
  // kedua yang bisa keliru sendiri. Baris draft/terjadwal memang ikut
  // terbaca fungsi ini — pemanggil (halaman Permalink) WAJIB menyaringnya
  // lewat pembantu terpusat sebelum merender apa pun, tidak pernah
  // menyuguhkan hasil fungsi ini langsung ke publik.
  //
  // `organizationNotDeleted` tetap dipasang di sini: Struktur Terhapus tidak
  // boleh terbaca di permukaan publik mana pun, apa pun status Beritanya.
  getBlogArticleBySlug: async (organizationId: string, slug: string) => {
    const [row] = await db
      .select()
      .from(article)
      .where(
        and(
          eq(article.organizationId, organizationId),
          eq(article.slug, slug),
          eq(article.type, 'blog'),
          organizationNotDeleted(article.organizationId)
        )
      )
      .limit(1)
    return row
  },

  // Ticket 09 (Halaman beralamat akar). Mirip `getBlogArticleBySlug` di atas
  // tapi menyaring `type: 'page'` — Halaman tidak bertanggal, jadi tidak ada
  // gerbang Terbit berbasis tanggal untuk diterapkan di sini. Draft/archived
  // tetap ikut terbaca; pemanggil (halaman Permalink Halaman) menyaringnya
  // lewat `resolvePermalinkHalaman` sebelum merender apa pun ke publik.
  getPageArticleBySlug: async (organizationId: string, slug: string) => {
    const [row] = await db
      .select()
      .from(article)
      .where(
        and(
          eq(article.organizationId, organizationId),
          eq(article.slug, slug),
          eq(article.type, 'page'),
          organizationNotDeleted(article.organizationId)
        )
      )
      .limit(1)
    return row
  },

  listDistinctTags: async (organizationId: string): Promise<string[]> => {
    const result = await db.execute(sql`
      SELECT DISTINCT unnest(${article.tags}) AS tag
      FROM ${article}
      WHERE ${article.organizationId} = ${organizationId}
        AND ${organizationNotDeleted(article.organizationId)}
    `)
    const rows = ((result as any).rows ?? result) as { tag: string }[]
    return rows.map((r) => r.tag)
  }
}

// Terbit gate for Aktivasi Situs (ticket 03, CONTEXT.md "Terbit"): the
// Struktur must hold at least one **Berita** — `type: 'blog'`, not a Halaman
// — whose status is 'published' and whose `publishedAt` has already passed.
// A future-dated Artikel is dinyatakan but not yet Terbit, and a Halaman
// doesn't count: CONTEXT.md calls it "tak bertanggal" and outside Berita's
// archive, so it can't be what "Berita Terbit" means.
//
// `publishedAt` is compared against `terbitCutoffForQuery()`
// (`~/lib/publikasi/tanggal-terbit`), not a raw `new Date()` — the column
// stores Asia/Jakarta wall-clock digits directly (ADR 0014), so comparing it
// straight against a true UTC instant is off by the WIB offset.
export const hasPublishedArticle = async (
  organizationId: string
): Promise<boolean> => {
  const [row] = await db
    .select({ id: article.id })
    .from(article)
    .where(
      and(
        eq(article.organizationId, organizationId),
        eq(article.type, 'blog'),
        eq(article.status, 'published'),
        lte(article.publishedAt, terbitCutoffForQuery()),
        organizationNotDeleted(article.organizationId)
      )
    )
    .limit(1)
  return Boolean(row)
}
