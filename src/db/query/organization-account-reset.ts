import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '../db'
import { organizationAccountPasswordReset } from '../schema/organization-account-password-reset.sql'
import { organization } from '../schema/organization.sql'
import { session } from '../schema/session.sql'
import { user } from '../schema/user.sql'

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
    passwordHash
  }: OrganizationAccountResetValues,
  failure?: OrganizationAccountResetFailure
): Promise<void> => {
  if (actorId === targetAccountId) {
    throw new Error('Reset actor cannot be the target account')
  }

  await db.transaction(async (tx) => {
    const [actor] = await tx
      .select({ id: user.id, username: user.name })
      .from(user)
      .where(eq(user.id, actorId))
      .limit(1)

    if (!actor) throw new Error('Reset actor was not found')

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

    const [targetOrganization] = await tx
      .select({ id: organization.id, name: organization.name })
      .from(organization)
      .where(eq(organization.id, targetOrganizationId))
      .limit(1)

    if (!targetOrganization)
      throw new Error('Target organization was not found')

    await tx.insert(organizationAccountPasswordReset).values({
      eventType: 'organization_account_password_reset',
      actorId: actor.id,
      actorUsername: actor.username,
      targetAccountId: target.id,
      targetUsername: target.username,
      targetRole: target.role,
      organizationId: targetOrganization.id,
      organizationName: targetOrganization.name
    })
    injectFailure(failure === 'after-audit-append' ? failure : undefined)
  })
}
