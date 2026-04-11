import { pgTable, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { sql, type SQL } from 'drizzle-orm'

export const organization = pgTable('organization', (t) => ({
  id: t
    .uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  name: t.text().notNull(),
  slug: t.text().notNull(),
  code: t.text().notNull(),
  codeSlug: t
    .text('code_slug')
    .generatedAlwaysAs((): SQL => sql`replace(lower(${sql`code`}), '.', '-')`)
    .notNull(),
  type: t.text({ enum: ['pp', 'pw', 'pdln', 'pd', 'pk'] }).notNull(),
  level: t
    .integer()
    .generatedAlwaysAs(
      (): SQL =>
        sql`CASE
          WHEN type = 'pp' THEN 1
          WHEN type = 'pw' THEN 2
          WHEN type IN ('pd', 'pdln') THEN 3
          WHEN type = 'pk' THEN 4
          ELSE NULL
        END`
    )
    .notNull(),
  logo: t.text(),
  parentId: t.uuid('parent_id').references((): AnyPgColumn => organization.id)
}))
