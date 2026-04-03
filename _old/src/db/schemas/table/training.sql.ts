import { pgTable, index, primaryKey } from 'drizzle-orm/pg-core'
import { organization } from './organization.sql'
import { member } from './member.sql'
import { sql } from 'drizzle-orm'

export const training = pgTable(
  'training',
  (f) => ({
    id: f
      .uuid()
      .primaryKey()
      .$default(() => Bun.randomUUIDv7()),
    name: f.text().notNull(),
    type: f
      .text({ enum: ['dm1', 'dm2', 'dm3', 'dpmk', 'tfi', 'other'] })
      .notNull(),
    dateStart: f.date('date_start', { mode: 'date' }).notNull(),
    dateEnd: f.date('date_end', { mode: 'date' }).notNull(),
    registrationUntil: f.date('registration_until', { mode: 'date' }),
    organizerId: f.uuid('organizer_id').references(() => organization.id)
  }),
  (t) => [
    index('training_organizer_id_idx').on(t.organizerId),
    index('training_date_start_idx').on(t.dateStart),
    index('training_date_end_idx').on(t.dateEnd),
    index('training_type_idx').on(t.type),
    index('training_name_gin_idx').using('gin', sql`${t.name} gin_trgm_ops`)
  ]
)

export const trainingAttendants = pgTable(
  'training_attendants',
  (f) => ({
    trainingId: f
      .uuid('training_id')
      .notNull()
      .references(() => training.id),
    attendantId: f
      .uuid('attendant_id')
      .notNull()
      .references(() => member.id),
    isPassing: f.boolean('is_passing').default(false),
    isAdmitted: f.boolean('is_admitted').default(false)
  }),
  (t) => [
    primaryKey({ columns: [t.trainingId, t.attendantId] }),
    index('training_attendants_training_id_idx').on(t.trainingId),
    index('training_attendants_attendant_id_idx').on(t.attendantId)
  ]
)

export const trainingInstructors = pgTable(
  'training_instructors',
  (f) => ({
    trainingId: f
      .uuid('training_id')
      .notNull()
      .references(() => training.id),
    instructorId: f
      .uuid('instructor_id')
      .notNull()
      .references(() => member.id),
    role: f.text({
      enum: [
        'mot',
        'assistant-mot',
        'mcr',
        'assistant-mcr',
        'lecturer',
        'ustadz-for-training',
        'lecturer-observer',
        'attendant-observer',
        'admin'
      ]
    }),
    isIntern: f.boolean('is_intern').default(false)
  }),
  (t) => [
    primaryKey({ columns: [t.trainingId, t.instructorId] }),
    index('training_instructors_training_id_idx').on(t.trainingId),
    index('training_instructors_instructor_id_idx').on(t.instructorId)
  ]
)
