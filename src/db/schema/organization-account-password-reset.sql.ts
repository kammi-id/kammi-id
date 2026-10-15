import { sql } from 'drizzle-orm'
import { pgTable } from 'drizzle-orm/pg-core'

export const organizationAccountPasswordReset = pgTable(
  'organization_account_password_reset',
  (t) => ({
    id: t
      .uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    eventType: t
      .text('event_type', {
        enum: ['organization_account_password_reset']
      })
      .notNull(),
    actorId: t.uuid('actor_id').notNull(),
    actorUsername: t.text('actor_username').notNull(),
    targetAccountId: t.uuid('target_account_id').notNull(),
    targetUsername: t.text('target_username').notNull(),
    targetRole: t.text('target_role').notNull(),
    organizationId: t.uuid('organization_id').notNull(),
    organizationName: t.text('organization_name').notNull(),
    createdAt: t
      .timestamp('created_at')
      .default(sql`now()`)
      .notNull()
  })
)
