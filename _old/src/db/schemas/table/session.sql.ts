import { pgTable, index } from 'drizzle-orm/pg-core'
import { user } from './user.sql'

export const session = pgTable(
  'session',
  (f) => ({
    id: f.uuid().primaryKey(),
    secretHash: f.text('secret_hash').notNull(),
    createdAt: f.bigint('created_at', { mode: 'number' }).notNull(),
    lastVerifiedAt: f.bigint('last_verified_at', { mode: 'number' }).notNull(),
    userId: f
      .uuid('user_id')
      .notNull()
      .references(() => user.id)
  }),
  (t) => [
    index('session_user_id_idx').on(t.userId),
    index('session_last_verified_at_idx').on(t.lastVerifiedAt)
  ]
)
