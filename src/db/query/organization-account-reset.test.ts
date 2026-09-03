import { beforeEach, describe, expect, test } from 'bun:test'
import { eq, sql } from 'drizzle-orm'
import { db } from '~/db/db'
import { organizationAccountPasswordReset } from '~/db/schema/organization-account-password-reset.sql'
import { member } from '~/db/schema/member.sql'
import { organization } from '~/db/schema/organization.sql'
import { session } from '~/db/schema/session.sql'
import { user } from '~/db/schema/user.sql'
import {
  resetOrganizationAccount,
  type OrganizationAccountResetFailure
} from './organization-account-reset'

const actorId = '0199f7df-7d10-7000-8000-000000000001'
const targetId = '0199f7df-7d10-7000-8000-000000000002'
const organizationId = '0199f7df-7d10-7000-8000-000000000003'

describe('resetOrganizationAccount', () => {
  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE "organization_account_password_reset", "session", "user", "organization" CASCADE`
    )

    await db.insert(organization).values({
      id: organizationId,
      name: 'PD Bandung',
      slug: 'pd-bandung',
      code: 'PD-01',
      type: 'pd'
    })
    await db.insert(user).values([
      {
        id: actorId,
        name: 'bph-pw-jabar',
        displayName: 'BPH PW Jabar',
        passwordHash: 'actor-hash',
        role: 'bph',
        connectedOrganizationId: organizationId
      },
      {
        id: targetId,
        name: 'bpk-pd-bandung',
        displayName: 'BPK PD Bandung',
        passwordHash: 'target-hash',
        role: 'bpk',
        connectedOrganizationId: organizationId
      }
    ])
    await db.insert(session).values([
      {
        id: '0199f7df-7d10-7000-8000-000000000004',
        secretHash: 'actor-secret',
        createdAt: new Date(),
        lastVerifiedAt: new Date(),
        userId: actorId
      },
      {
        id: '0199f7df-7d10-7000-8000-000000000005',
        secretHash: 'target-secret-1',
        createdAt: new Date(),
        lastVerifiedAt: new Date(),
        userId: targetId
      },
      {
        id: '0199f7df-7d10-7000-8000-000000000006',
        secretHash: 'target-secret-2',
        createdAt: new Date(),
        lastVerifiedAt: new Date(),
        userId: targetId
      }
    ])
  })

  test('replaces one management account password, revokes only its sessions, and appends its audit event', async () => {
    await resetOrganizationAccount({
      actorId,
      targetAccountId: targetId,
      targetOrganizationId: organizationId,
      passwordHash: 'new-target-hash'
    })

    const [target] = await db
      .select({ passwordHash: user.passwordHash })
      .from(user)
      .where(eq(user.id, targetId))
    const remainingSessions = await db.select().from(session)
    const [audit] = await db.select().from(organizationAccountPasswordReset)

    expect(target?.passwordHash).toBe('new-target-hash')
    expect(remainingSessions.map(({ userId }) => userId)).toEqual([actorId])
    expect(audit).toMatchObject({
      eventType: 'organization_account_password_reset',
      actorId,
      actorUsername: 'bph-pw-jabar',
      targetAccountId: targetId,
      targetUsername: 'bpk-pd-bandung',
      targetRole: 'bpk',
      organizationId,
      organizationName: 'PD Bandung'
    })
  })

  test.each<OrganizationAccountResetFailure>([
    'after-password-update',
    'after-session-revocation',
    'after-audit-append'
  ])('rolls back every write when %s fails', async (failure) => {
    await expect(
      resetOrganizationAccount(
        {
          actorId,
          targetAccountId: targetId,
          targetOrganizationId: organizationId,
          passwordHash: 'new-target-hash'
        },
        failure
      )
    ).rejects.toThrow('Injected reset failure')

    const [target] = await db
      .select({ passwordHash: user.passwordHash })
      .from(user)
      .where(eq(user.id, targetId))
    const remainingSessions = await db.select().from(session)
    const audits = await db.select().from(organizationAccountPasswordReset)

    expect(target?.passwordHash).toBe('target-hash')
    expect(remainingSessions.map(({ userId }) => userId).sort()).toEqual(
      [actorId, targetId, targetId].sort()
    )
    expect(audits).toHaveLength(0)
  })

  test('rejects an account that is not a management account without writing anything', async () => {
    await db.update(user).set({ role: 'member' }).where(eq(user.id, targetId))

    await expect(
      resetOrganizationAccount({
        actorId,
        targetAccountId: targetId,
        targetOrganizationId: organizationId,
        passwordHash: 'new-target-hash'
      })
    ).rejects.toThrow('Target organization account was not found')

    const [target] = await db
      .select({ passwordHash: user.passwordHash })
      .from(user)
      .where(eq(user.id, targetId))
    const audits = await db.select().from(organizationAccountPasswordReset)

    expect(target?.passwordHash).toBe('target-hash')
    expect(audits).toHaveLength(0)
  })

  test('rejects an account linked to a Member without writing anything', async () => {
    const memberId = '0199f7df-7d10-7000-8000-000000000007'
    await db.insert(member).values({
      id: memberId,
      name: 'Kader Bandung',
      registerNumber: 'PD01-0001',
      organizationId,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2026
    })
    await db
      .update(user)
      .set({ connectedMemberId: memberId })
      .where(eq(user.id, targetId))

    await expect(
      resetOrganizationAccount({
        actorId,
        targetAccountId: targetId,
        targetOrganizationId: organizationId,
        passwordHash: 'new-target-hash'
      })
    ).rejects.toThrow('Target organization account was not found')

    const [target] = await db
      .select({ passwordHash: user.passwordHash })
      .from(user)
      .where(eq(user.id, targetId))
    const targetSessions = await db
      .select()
      .from(session)
      .where(eq(session.userId, targetId))
    const audits = await db.select().from(organizationAccountPasswordReset)

    expect(target?.passwordHash).toBe('target-hash')
    expect(targetSessions).toHaveLength(2)
    expect(audits).toHaveLength(0)
  })

  test('rejects the actor as target without revoking the actor session', async () => {
    await expect(
      resetOrganizationAccount({
        actorId,
        targetAccountId: actorId,
        targetOrganizationId: organizationId,
        passwordHash: 'new-actor-hash'
      })
    ).rejects.toThrow('Reset actor cannot be the target account')

    const [actor] = await db
      .select({ passwordHash: user.passwordHash })
      .from(user)
      .where(eq(user.id, actorId))
    const actorSessions = await db
      .select()
      .from(session)
      .where(eq(session.userId, actorId))
    const audits = await db.select().from(organizationAccountPasswordReset)

    expect(actor?.passwordHash).toBe('actor-hash')
    expect(actorSessions).toHaveLength(1)
    expect(audits).toHaveLength(0)
  })
})
