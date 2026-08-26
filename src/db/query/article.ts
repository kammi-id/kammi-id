import { db } from '~/db/db'
import { article } from '~/db/schema/article.sql'
import { organizationNotDeleted } from '~/db/query/organization'
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
 * Terbit (spec "Artikel di permukaan publik"): dinyatakan terbit **dan**
 * tanggal terbitnya sudah lewat — sebuah Berita berjadwal di masa depan
 * bukan Berita terbaca. A pure predicate, mirroring `isArticleOrgInScope`
 * below, so the rule is unit-testable without a database.
 */
export const isBeritaTerbit = (
  a: { status: ArticleStatus; publishedAt: Date | null },
  now: Date = new Date()
): boolean =>
  a.status === 'published' && a.publishedAt !== null && a.publishedAt <= now

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
        lte(article.publishedAt, new Date()),
        organizationNotDeleted(article.organizationId)
      )
    )
    .limit(1)
  return Boolean(row)
}
