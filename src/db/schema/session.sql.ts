import { mysqlTable } from 'drizzle-orm/mysql-core'

export const sessionTable = mysqlTable('sessions', (t) => ({
  id: t.varchar('id', { length: 36 }).notNull().primaryKey(),
  secretHash: t.binary('secret_hash').notNull(),
  createdAt: t.timestamp('created_at').defaultNow().notNull(),
  lastVerifiedAt: t.timestamp('last_verified_at').notNull()
}))
