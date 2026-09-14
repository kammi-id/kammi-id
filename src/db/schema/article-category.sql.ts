import { pgTable, unique, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organization } from './organization.sql'

export const articleCategory = pgTable(
  'article_category',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    organizationId: t
      .uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    name: t.text().notNull(),
    slug: t.text().notNull(),
    parentId: t
      .uuid('parent_id')
      .references((): AnyPgColumn => articleCategory.id, {
        onDelete: 'set null'
      })
  }),
  (table) => [unique().on(table.organizationId, table.slug)]
)
