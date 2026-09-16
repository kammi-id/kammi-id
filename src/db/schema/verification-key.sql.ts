import { pgTable, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const verificationKey = pgTable(
  'verification_key',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    secretHash: t.text('secret_hash').notNull(),
    createdAt: t
      .timestamp('created_at')
      .default(sql`now()`)
      .notNull(),
    lastUsedAt: t.timestamp('last_used_at'),
    revokedAt: t.timestamp('revoked_at')
  }),
  (table) => [
    unique('verification_key_secret_hash_unique').on(table.secretHash)
  ]
)

export const verificationAccessLog = pgTable(
  'verification_access_log',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    keyId: t.uuid('key_id').references(() => verificationKey.id),
    occurredAt: t
      .timestamp('occurred_at')
      .default(sql`now()`)
      .notNull(),
    outcome: t
      .text({ enum: ['found', 'not_found', 'unauthorized', 'rate_limited'] })
      .notNull(),
    reason: t.text({
      enum: ['invalid_key', 'not_found', 'not_verifiable', 'rate_limited']
    })
  })
)

export const verificationRateWindow = pgTable(
  'verification_rate_window',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    keyId: t
      .uuid('key_id')
      .notNull()
      .references(() => verificationKey.id),
    windowStartedAt: t.timestamp('window_started_at').notNull(),
    requestCount: t.integer('request_count').default(1).notNull()
  }),
  (table) => [
    unique('verification_rate_window_key_window_unique').on(
      table.keyId,
      table.windowStartedAt
    )
  ]
)
