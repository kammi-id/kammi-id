import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import { db } from '../db'
import { organizationAccountPasswordReset } from '../schema/organization-account-password-reset.sql'
import { organization } from '../schema/organization.sql'
import { session } from '../schema/session.sql'
import { user } from '../schema/user.sql'
import type { AccessScope } from './organization'

const RESETTABLE_ORGANIZATION_ACCOUNT_ROLES = [
  'bph',
  'bpk',
  'bpw',
  'humas'
] as const

export type OrganizationAccountResetFailure =
  | 'after-password-update'
  | 'after-session-revocation'
  | 'after-audit-append'

type OrganizationAccountResetValues = {
  actorId: string
  targetAccountId: string
  targetOrganizationId: string
  passwordHash: string
  accessScope?: AccessScope
}

const injectFailure = (
  failure: OrganizationAccountResetFailure | undefined
) => {
  if (failure) throw new Error('Injected reset failure')
}

/**
 * Replaces one actual Akun Kepengurusan credential and leaves an append-only
 * trace. Authorization and password reauthentication belong to the Server
 * Action; this transaction protects the integrity of the target it is given.
 */
export const resetOrganizationAccount = async (
  {
    actorId,
    targetAccountId,
    targetOrganizationId,
    passwordHash,
    accessScope
  }: OrganizationAccountResetValues,
  failure?: OrganizationAccountResetFailure
): Promise<{ username: string }> => {
  if (actorId === targetAccountId) {
    throw new Error('Reset actor cannot be the target account')
  }

  return await db.transaction(async (tx) => {
    const [actor] = await tx
      .select({
        id: user.id,
        username: user.name,
        role: user.role,
        connectedOrganizationId: user.connectedOrganizationId
      })
      .from(user)
      .where(eq(user.id, actorId))
      .limit(1)

    if (
      !actor ||
      (accessScope && actor.role !== accessScope.role) ||
      (accessScope &&
        actor.connectedOrganizationId !== accessScope.connectedOrganizationId)
    ) {
      throw new Error('Reset actor was not authorized')
    }

    const targetOrganization = await tx.execute(sql`
      SELECT id, name
      FROM ${organization}
      WHERE id = ${targetOrganizationId} AND deleted_at IS NULL
      FOR UPDATE
    `)

    const targetOrg = targetOrganization[0]
    if (!targetOrg) throw new Error('Target organization was not found')

    if (accessScope?.connectedOrganizationId === targetOrganizationId) {
      throw new Error('Reset actor cannot reset own organization account')
    }

    if (accessScope && accessScope.role !== 'root') {
      if (!accessScope.connectedOrganizationId) {
        throw new Error('Reset actor was not authorized')
      }

      const inScope = await tx.execute(sql`
        WITH RECURSIVE org_hierarchy AS (
          SELECT id FROM ${organization}
          WHERE id = ${accessScope.connectedOrganizationId}
            AND deleted_at IS NULL
          UNION ALL
          SELECT child.id FROM ${organization} child
          JOIN org_hierarchy parent ON child.parent_id = parent.id
          WHERE child.deleted_at IS NULL
        )
        SELECT id FROM org_hierarchy WHERE id = ${targetOrganizationId}
      `)
      if (inScope.length === 0) {
        throw new Error('Target organization was not in reset scope')
      }
    }

    const [target] = await tx
      .update(user)
      .set({ passwordHash })
      .where(
        and(
          eq(user.id, targetAccountId),
          eq(user.connectedOrganizationId, targetOrganizationId),
          isNull(user.connectedMemberId),
          inArray(user.role, RESETTABLE_ORGANIZATION_ACCOUNT_ROLES)
        )
      )
      .returning({
        id: user.id,
        username: user.name,
        role: user.role
      })

    if (!target) throw new Error('Target organization account was not found')
    injectFailure(failure === 'after-password-update' ? failure : undefined)

    await tx.delete(session).where(eq(session.userId, target.id))
    injectFailure(failure === 'after-session-revocation' ? failure : undefined)

    await tx.insert(organizationAccountPasswordReset).values({
      eventType: 'organization_account_password_reset',
      actorId: actor.id,
      actorUsername: actor.username,
      targetAccountId: target.id,
      targetUsername: target.username,
      targetRole: target.role,
      organizationId: targetOrg.id,
      organizationName: targetOrg.name
    })
    injectFailure(failure === 'after-audit-append' ? failure : undefined)

    return { username: target.username }
  })
}
