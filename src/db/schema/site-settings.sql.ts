import { pgTable } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const siteSettings = pgTable('site_settings', (t) => ({
  key: t.text().primaryKey(),
  data: t.jsonb().notNull(),
  updatedAt: t
    .timestamp('updated_at')
    .default(sql`now()`)
    .notNull()
}))
