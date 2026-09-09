import { pgTable } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { member } from './member.sql'

export const memberCareer = pgTable('member_career', (t) => ({
  id: t
    .uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  memberId: t
    .uuid('member_id')
    .notNull()
    .references(() => member.id),
  profession: t.text('profession').notNull(),
  company: t.text('company').notNull(),
  yearStart: t.integer('year_start').notNull(),
  yearEnd: t.integer('year_end')
}))
