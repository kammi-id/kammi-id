import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  date,
  uniqueIndex
} from 'drizzle-orm/pg-core'
import { sql, eq } from 'drizzle-orm'
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
  registrationStartDate: t.date('registration_start_date'),
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
    pk: { columns: [table.trainingId, table.memberId], primaryKey: true },
    /**
     * Satu Daurah, satu Master of Training — organisasi menegaskan ini di
     * luar kode, jadi ia ditegakkan di sini juga, bukan cuma di
     * `addInstructorAction`. `(trainingId, memberId)` di atas mencegah satu
     * orang memegang dua peran sekaligus, tapi tidak mencegah dua orang
     * berbeda sama-sama `master` pada Daurah yang sama.
     *
     * Partial unique index, bukan constraint biasa: aturannya hanya berlaku
     * untuk baris ber-`role = 'master'` — peran lain tetap boleh diisi lebih
     * dari satu orang. Namanya dieja tangan, mengikuti pola
     * `organization_slug_live_unique`: penanganan `23505` di jalur tulis
     * (`isMasterConflict`, `src/lib/daurah/master-conflict.ts`) menyebutnya
     * langsung, dan nama turunan bergeser diam-diam kalau kolomnya berubah.
     */
    masterUniquePerTraining: uniqueIndex('training_instructors_master_unique')
      .on(table.trainingId)
      .where(eq(table.role, 'master'))
  })
)
