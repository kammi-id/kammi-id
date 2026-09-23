import { and, eq, lte } from 'drizzle-orm'
import { db } from '~/db/db'
import { article } from '~/db/schema/article.sql'
import { organizationNotDeleted } from '~/db/query/organization'
import { terbitCutoffForQuery } from '~/lib/publikasi/tanggal-terbit'

export type SitemapArticlesForOrg = {
  halaman: Array<{ slug: string; updatedAt: Date }>
  berita: Array<{ slug: string; publishedAt: Date; updatedAt: Date }>
}

/**
 * The public articles that may be exposed by a Struktur's sitemap. Berita
 * follows the same Terbit gate as its archive; Halaman has no publish date,
 * so its published status is the complete public gate.
 */
export const listSitemapArticlesForOrg = async (
  organizationId: string
): Promise<SitemapArticlesForOrg> => {
  const [halaman, berita] = await Promise.all([
    db
      .select({ slug: article.slug, updatedAt: article.updatedAt })
      .from(article)
      .where(
        and(
          eq(article.organizationId, organizationId),
          eq(article.type, 'page'),
          eq(article.status, 'published'),
          organizationNotDeleted(article.organizationId)
        )
      ),
    db
      .select({
        slug: article.slug,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt
      })
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
  ])

  return {
    halaman,
    berita: berita.filter(
      (item): item is typeof item & { publishedAt: Date } =>
        item.publishedAt !== null
    )
  }
}
