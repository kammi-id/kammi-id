import { pgTable, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organization } from './organization.sql'

export const siteSettings = pgTable(
  'site_settings',
  (t) => ({
    key: t.text().notNull(),
    organizationId: t
      .uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    data: t.jsonb().notNull(),
    updatedAt: t
      .timestamp('updated_at')
      .default(sql`now()`)
      .notNull(),
  }),
  (table) => [unique().on(table.key, table.organizationId)]
)
