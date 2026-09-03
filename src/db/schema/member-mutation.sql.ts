import { pgTable, type AnyPgColumn } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { member } from './member.sql'
import { organization } from './organization.sql'

/**
 * Record of a Kader crossing a Cakupan boundary (ADR 0020). Not
 * `member_organization_history` — that table already means Organisasi
 * Eksternal (outside KAMMI, free text) and must not carry a second meaning.
 *
 * Mutation changes `member.organization_id` only: NIA, Akun, and Daurah
 * history are untouched. This row is the only reason a NIA whose prefix
 * points at one PD can legitimately sit under another today.
 *
 * `memberId` is a plain (NO ACTION) reference on purpose: a mutation row is
 * one of the rows ADR 0021's Hapus Selamanya must find and block on, so a
 * Kader with mutation history cannot be hard-deleted out from under its own
 * audit trail.
 */
export const memberMutation = pgTable('member_mutation', (t) => ({
  id: t
    .uuid()
    .primaryKey()
    .default(sql`uuidv7()`),
  memberId: t
    .uuid('member_id')
    .notNull()
    .references((): AnyPgColumn => member.id),
  fromOrganizationId: t
    .uuid('from_organization_id')
    .notNull()
    .references((): AnyPgColumn => organization.id),
  toOrganizationId: t
    .uuid('to_organization_id')
    .notNull()
    .references((): AnyPgColumn => organization.id),
  movedAt: t
    .timestamp('moved_at')
    .default(sql`now()`)
    .notNull(),
  // Not a `references()` FK, matching the actor-column precedent in
  // `organization_account_password_reset.sql.ts`: an audit trail should not
  // itself become the reason an unrelated Akun can never be hard-deleted.
  movedBy: t.uuid('moved_by').notNull()
}))
