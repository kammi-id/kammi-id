import { pgTable } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { member } from './member.sql'

export const memberOrganizationHistory = pgTable(
  'member_organization_history',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    memberId: t
      .uuid('member_id')
      .notNull()
      .references(() => member.id),
    position: t.text('position').notNull(),
    organization: t.text('organization').notNull(),
    yearStart: t.integer('year_start').notNull(),
    yearEnd: t.integer('year_end')
  })
)
