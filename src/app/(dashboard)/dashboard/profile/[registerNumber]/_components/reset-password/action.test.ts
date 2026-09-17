import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { db } from '~/db/db'
import { eq, sql } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'
import { createMember } from '~/db/query/member'
import { user as userTable } from '~/db/schema/user.sql'
import { session as sessionTable } from '~/db/schema/session.sql'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

const { regenerateCredentialAction } = await import('./action')

describe('regenerateCredentialAction', () => {
  let pkItbId: string
  let pkOtherId: string

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE "user", "member", organization CASCADE`)
    mockSession = undefined

    const [pwJabar] = await createOrganization({
      name: 'PW Jabar',
      slug: 'pw-jabar',
      code: 'PW-01',
      type: 'pw',
      parentId: null,
      isNonActive: false
    })

    const [pwJatim] = await createOrganization({
      name: 'PW Jatim',
      slug: 'pw-jatim',
      code: 'PW-02',
      type: 'pw',
      parentId: null,
      isNonActive: false
    })

    const [pkItb] = await createOrganization({
      name: 'PK ITB',
      slug: 'pk-itb',
      code: 'PK-01',
      type: 'pk',
      parentId: pwJabar.id,
      isNonActive: false
    })
    pkItbId = pkItb.id

    const [pkOther] = await createOrganization({
      name: 'PK Other',
      slug: 'pk-other',
      code: 'PK-02',
      type: 'pk',
      parentId: pwJatim.id,
      isNonActive: false
    })
    pkOtherId = pkOther.id
  })

  const createTestMember = async (organizationId: string) => {
    const [created] = await createMember({
      name: 'Anggota Test',
      registerNumber: 'PK01-0001',
      organizationId,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2020
    })
    return created
  }

  const passwordHashFor = async (memberId: string) => {
    const [row] = await db
      .select({ passwordHash: userTable.passwordHash })
      .from(userTable)
      .where(eq(userTable.connectedMemberId, memberId))
    return row?.passwordHash
  }

  it('rejects when there is no active session', async () => {
    mockSession = undefined
    const member = await createTestMember(pkItbId)

    const result = await regenerateCredentialAction(member.id)

    expect(result.success).toBe(false)
    expect(result.message).toBe('Tidak terautentikasi')
  })

  it('rejects for a role outside the mutation allowlist', async () => {
    mockSession = { user: { id: 'u1', role: 'humas' } }
    const member = await createTestMember(pkItbId)
    const before = await passwordHashFor(member.id)

    const result = await regenerateCredentialAction(member.id)

    expect(result.success).toBe(false)
    expect(result.message).toBe('Role tidak diizinkan untuk aksi ini')
    expect(await passwordHashFor(member.id)).toBe(before)
  })

  it('rejects a bpk resetting credentials for a member outside their org scope', async () => {
    mockSession = {
      user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
    }
    const member = await createTestMember(pkOtherId)
    const before = await passwordHashFor(member.id)

    const result = await regenerateCredentialAction(member.id)

    expect(result.success).toBe(false)
    expect(result.message).toBe('Kader ini bukan dalam scope organisasi antum')
    expect(await passwordHashFor(member.id)).toBe(before)
  })

  it('regenerates the password when role and scope both pass', async () => {
    mockSession = {
      user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
    }
    const member = await createTestMember(pkItbId)
    const before = await passwordHashFor(member.id)

    const result = await regenerateCredentialAction(member.id)

    expect(result.success).toBe(true)
    expect(result.data?.password).toBeTruthy()
    const passwordHash = await passwordHashFor(member.id)
    expect(passwordHash).not.toBe(before)
    expect(
      await Bun.password.verify(result.data?.password ?? '', passwordHash!)
    ).toBe(true)
  })

  it('allows root to reset credentials for a member in any org', async () => {
    mockSession = { user: { id: 'u1', role: 'root' } }
    const member = await createTestMember(pkOtherId)
    const before = await passwordHashFor(member.id)

    const result = await regenerateCredentialAction(member.id)

    expect(result.success).toBe(true)
    expect(await passwordHashFor(member.id)).not.toBe(before)
  })

  it('rejects resetting credentials for a member that does not exist', async () => {
    mockSession = { user: { id: 'u1', role: 'root' } }

    const result = await regenerateCredentialAction(
      '00000000-0000-0000-0000-000000000000'
    )

    expect(result.success).toBe(false)
    expect(result.message).toBe('Kader tidak ditemukan')
  })

  // ADR 0027 / ADR 0028, "Sekalian" — reset password oleh pengurus memutus
  // SELURUH sesi Akun ini, tanpa pengecualian. Tanpa ini, "reset password
  // Kader ini" tidak berarti apa yang dikira penekannya: cookie lama tetap
  // sah sampai tiga hari.
  it('memutus seluruh sesi Akun yang direset', async () => {
    mockSession = {
      user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
    }
    const member = await createTestMember(pkItbId)

    const [connectedUser] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.connectedMemberId, member.id))

    await db.insert(sessionTable).values([
      {
        id: Bun.randomUUIDv7(),
        secretHash: 'irrelevant-1',
        createdAt: new Date(),
        lastVerifiedAt: new Date(),
        userId: connectedUser.id
      },
      {
        id: Bun.randomUUIDv7(),
        secretHash: 'irrelevant-2',
        createdAt: new Date(),
        lastVerifiedAt: new Date(),
        userId: connectedUser.id
      }
    ])

    const before = await db
      .select({ id: sessionTable.id })
      .from(sessionTable)
      .where(eq(sessionTable.userId, connectedUser.id))
    expect(before.length).toBe(2)

    const result = await regenerateCredentialAction(member.id)

    expect(result.success).toBe(true)
    const after = await db
      .select({ id: sessionTable.id })
      .from(sessionTable)
      .where(eq(sessionTable.userId, connectedUser.id))
    expect(after.length).toBe(0)
  })
})
