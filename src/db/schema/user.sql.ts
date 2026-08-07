import { pgTable } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { organization } from './organization.sql'
import { member } from './member.sql'

export const user = pgTable('user', (t) => ({
  id: t
    .uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  name: t.text('name').notNull().unique(),
  displayName: t.text('display_name').notNull(),
  passwordHash: t.text('password_hash').notNull(),
  role: t
    .text({ enum: ['root', 'bph', 'bpk', 'bpw', 'humas', 'member'] })
    .notNull(),
  connectedOrganizationId: t
    .uuid('connected_organization_id')
    .references(() => organization.id),
  connectedMemberId: t
    .uuid('connected_member_id')
    .references(() => member.id, { onDelete: 'cascade' })
}))
