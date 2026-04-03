import {
  pgTable,
  index,
  uniqueIndex,
  type AnyPgColumn
} from 'drizzle-orm/pg-core'
import { sql, type SQL } from 'drizzle-orm'

export const organization = pgTable(
  'organization',
  (f) => ({
    id: f
      .uuid()
      .primaryKey()
      .$default(() => Bun.randomUUIDv7()),
    name: f.text().notNull(),
    slug: f.text().notNull().unique(),
    code: f.text().notNull().unique(),
    codeSlug: f
      .text('code_slug')
      .notNull()
      .unique()
      .generatedAlwaysAs(
        (): SQL => sql`lower(replace(${organization.code}, '.', '-'))`
      ),
    type: f.text({ enum: ['pp', 'pw', 'pd', 'pdln', 'pk'] }).notNull(),
    level: f
      .smallint()
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`
        case ${organization.type}
          when 'pp' then 1
          when 'pw' then 2
          when 'pd' then 3
          when 'pdln' then 3
          when 'pk' then 4
        end
      `
      ),
    logo: f.text(),
    isActive: f.boolean('is_active').default(true),
    parentId: f.uuid('parent_id').references((): AnyPgColumn => organization.id)
  }),
  (t) => [
    index('organization_parent_id_idx').on(t.parentId),
    uniqueIndex('organization_code_idx').on(t.code),
    uniqueIndex('organization_code_slug_idx').on(t.codeSlug),
    index('organization_name_gin_idx').using('gin', sql`${t.name} gin_trgm_ops`)
  ]
)
