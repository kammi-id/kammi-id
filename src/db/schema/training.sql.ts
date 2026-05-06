import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  date
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organization } from './organization.sql'
import { member } from './member.sql'

export const training = pgTable('training', (t) => ({
  id: t
    .uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  organizationId: t
    .uuid('organization_id')
    .notNull()
    .references(() => organization.id),
  name: t.text('name').notNull(),
  startDate: t.date('start_date').notNull(),
  endDate: t.date('end_date').notNull(),
  registrationDeadline: t.date('registration_deadline'),
  type: t
    .text('type', { enum: ['dm1', 'dm2', 'dpmk', 'tfi', 'dm3', 'other'] })
    .notNull(),
  year: t
    .integer('year')
    .generatedAlwaysAs(
      () => sql`CAST(EXTRACT(YEAR FROM start_date) AS INTEGER)`
    ),
  identifier: t.integer('identifier').notNull()
}))

export const trainingAttendants = pgTable(
  'training_attendants',
  (t) => ({
    trainingId: t
      .uuid('training_id')
      .notNull()
      .references(() => training.id),
    memberId: t
      .uuid('member_id')
      .notNull()
      .references(() => member.id),
    isPassing: t.boolean('is_passing').default(false).notNull()
  }),
  (table) => ({
    pk: { columns: [table.trainingId, table.memberId], primaryKey: true }
  })
)

export const trainingInstructors = pgTable(
  'training_instructors',
  (t) => ({
    trainingId: t
      .uuid('training_id')
      .notNull()
      .references(() => training.id),
    memberId: t
      .uuid('member_id')
      .notNull()
      .references(() => member.id),
    role: t
      .text('role', {
        enum: [
          'master',
          'assistant_master',
          'administrator',
          'classroom_master',
          'lecturer',
          'observer',
          'ustadz_of_training'
        ]
      })
      .notNull()
  }),
  (table) => ({
    pk: { columns: [table.trainingId, table.memberId], primaryKey: true }
  })
)
