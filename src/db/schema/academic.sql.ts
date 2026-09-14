import { pgTable } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { member } from './member.sql'

export const memberAcademic = pgTable('member_academic', (t) => ({
  id: t
    .uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  memberId: t
    .uuid('member_id')
    .notNull()
    .references(() => member.id),
  degree: t
    .text('degree', {
      enum: ['d1', 'd2', 'd3', 'd4', 's1', 's2', 's3', 'profesi']
    })
    .notNull(),
  studyProgram: t.text('study_program').notNull(),
  institutionName: t.text('institution_name').notNull(),
  institutionData: t.jsonb('institution_data').notNull(),
  yearStart: t.integer('year_start').notNull(),
  yearEnd: t.integer('year_end'),
  isGraduated: t.boolean('is_graduated').notNull()
}))
