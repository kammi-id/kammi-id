import { pgTable, index } from 'drizzle-orm/pg-core'
import { organization } from './organization.sql'
import { member } from './member.sql'

export const user = pgTable(
  'user',
  (f) => ({
    id: f
      .uuid()
      .primaryKey()
      .$default(() => Bun.randomUUIDv7()),
    name: f.text().notNull().unique(),
    displayName: f.text('display_name'),
    passwordHash: f.text('password_hash').notNull(),
    role: f
      .text({
        enum: ['root', 'bph', 'bpk', 'bpw', 'humas', 'member']
      })
      .notNull(),
    connectedOrganizationId: f
      .uuid('connected_organization_id')
      .references(() => organization.id, { onDelete: 'cascade' }),
    connectedMemberId: f
      .uuid('connected_member_id')
      .references(() => member.id, {
        onDelete: 'cascade'
      })
  }),
  (t) => [
    index('user_connected_organization_id_idx').on(t.connectedOrganizationId),
    index('user_connected_member_id_idx').on(t.connectedMemberId)
  ]
)
