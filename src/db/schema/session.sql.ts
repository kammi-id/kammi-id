import { index, pgTable } from 'drizzle-orm/pg-core'
import { user } from './user.sql'

export const session = pgTable(
  'session',
  (t) => ({
    id: t.uuid().primaryKey(),
    secretHash: t.text('secret_hash').notNull(),
    createdAt: t.timestamp('created_at').notNull(),
    lastVerifiedAt: t.timestamp('last_verified_at').notNull(),
    userId: t
      .uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' })
  }),
  (table) => [
    // `deleteSessionsByUser` menyapu seluruh sesi satu pengguna lewat kolom
    // ini, dan Postgres tidak mengindeks sisi anak sebuah foreign key sendiri
    // — tanpa indeks ini setiap reset password memindai seluruh tabel sesi.
    index('session_user_id_idx').on(table.userId)
  ]
)
