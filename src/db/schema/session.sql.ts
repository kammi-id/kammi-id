import { pgTable } from 'drizzle-orm/pg-core'
import { user } from './user.sql'

export const session = pgTable('session', (t) => ({
  id: t.uuid().primaryKey(),
  secretHash: t.text('secret_hash').notNull(),
  createdAt: t.timestamp('created_at').notNull(),
  lastVerifiedAt: t.timestamp('last_verified_at').notNull(),
  userId: t
    .uuid('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
}))
