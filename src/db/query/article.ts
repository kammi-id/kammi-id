import { db } from '~/db/db'
import { article } from '~/db/schema/article.sql'
import { organizationNotDeleted } from '~/db/query/organization'
import { eq, and, ilike, desc, sql } from 'drizzle-orm'

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

export type ArticleType = 'page' | 'blog'
export type ArticleStatus = 'draft' | 'published' | 'archived'

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
