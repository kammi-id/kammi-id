import { db } from '~/db/db'
import { articleCategory } from '~/db/schema/article-category.sql'
import { organizationNotDeleted } from '~/db/query/organization'
import { and, eq } from 'drizzle-orm'

type CategoryNode = { id: string; parentId: string | null }

export const wouldCreateCycle = (
  categoryId: string,
  newParentId: string | null,
  allCategories: CategoryNode[]
): boolean => {
  if (!newParentId) return false
  if (newParentId === categoryId) return true

  let current: string | null = newParentId
  const byId = new Map(allCategories.map((c) => [c.id, c]))
  const visited = new Set<string>()

  while (current) {
    if (current === categoryId) return true
    if (visited.has(current)) return false // already-broken chain, not our concern here
    visited.add(current)
    current = byId.get(current)?.parentId ?? null
  }

  return false
}

export const articleCategoryQuery = {
  // Spec §7, same standing as `articleQuery.listForOrg`: the rule is installed
  // ahead of the surface that will read it.
  listForOrg: async (organizationId: string) => {
    return await db
      .select()
      .from(articleCategory)
      .where(
        and(
          eq(articleCategory.organizationId, organizationId),
          organizationNotDeleted(articleCategory.organizationId)
        )
      )
  },

  create: async (values: typeof articleCategory.$inferInsert) => {
    const [created] = await db
      .insert(articleCategory)
      .values(values)
      .returning()
    return created
  },

  update: async (
    id: string,
    values: Partial<typeof articleCategory.$inferInsert>
  ) => {
    const [updated] = await db
      .update(articleCategory)
      .set(values)
      .where(eq(articleCategory.id, id))
      .returning()
    return updated
  },

  delete: async (id: string) => {
    // Deleting a category referenced by an ARTICLE throws an FK-restrict
    // violation (article.categoryId has onDelete: 'restrict') — caught by the
    // calling action and surfaced as a friendly error message. Deleting a
    // category that is a PARENT of other categories does NOT throw: its children
    // are intentionally re-parented to null (become top-level) via the parentId
    // onDelete: 'set null' rule.
    const [deleted] = await db
      .delete(articleCategory)
      .where(eq(articleCategory.id, id))
      .returning()
    return deleted
  },

  getById: async (id: string) => {
    const [row] = await db
      .select()
      .from(articleCategory)
      .where(
        and(
          eq(articleCategory.id, id),
          organizationNotDeleted(articleCategory.organizationId)
        )
      )
      .limit(1)
    return row
  }
}
