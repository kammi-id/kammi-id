import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { db } from '~/db/db'
import { sql, eq } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'
import { member as memberTable } from '~/db/schema/member.sql'
import { user as userTable } from '~/db/schema/user.sql'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { bulkCreateMembersAction } = await import('./action')

describe('bulkCreateMembersAction', () => {
  let pkItbId: string
  let pkOtherId: string

  beforeEach(async () => {
    // `register_number_sequence` is keyed by prefix, not by org id or member
    // row (ADR 0020 — the high-water mark is deliberately independent of
    // both), so truncating `member`/`organization` alone leaves an earlier
    // test's allocations in place for the same `19012024` prefix.
    await db.execute(
      sql`TRUNCATE TABLE "user", "member", "register_number_sequence", organization CASCADE`
    )
    mockSession = undefined

    const [pkItb] = await createOrganization({
      name: 'PK ITB',
      slug: 'pk-itb',
      code: '19.PD-1',
      type: 'pk',
      parentId: null,
      isNonActive: false
    })
    pkItbId = pkItb.id

    const [pkOther] = await createOrganization({
      name: 'PK Other',
      slug: 'pk-other',
      code: '20.PD-2',
      type: 'pk',
      parentId: null,
      isNonActive: false
    })
    pkOtherId = pkOther.id
  })

  const baseMember = (name: string) => ({
    name,
    gender: 'ikhwan' as const,
    status: 'ab1' as const,
    yearOfEntry: 2024,
    isCertifiedMentor: false,
    isCertifiedInstructor: false
  })

  it('rejects when there is no active session', async () => {
    mockSession = undefined

    const result = await bulkCreateMembersAction({
      members: [baseMember('A')],
      organizationId: pkItbId
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Sesi tidak ditemukan.')
  })

  it('rejects for a role outside the mutation allowlist', async () => {
    mockSession = { user: { id: 'u1', role: 'humas' } }

    const result = await bulkCreateMembersAction({
      members: [baseMember('A')],
      organizationId: pkItbId
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe(
      'Hanya BPK atau root yang dapat melakukan bulk upload.'
    )
  })

  it('rejects a bpk uploading into an org outside their scope', async () => {
    mockSession = {
      user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
    }

    const result = await bulkCreateMembersAction({
      members: [baseMember('A')],
      organizationId: pkOtherId
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe(
      'Antum tidak memiliki hak akses untuk organisasi ini.'
    )

    const created = await db
      .select()
      .from(memberTable)
      .where(eq(memberTable.organizationId, pkOtherId))
    expect(created).toHaveLength(0)
  })

  it('creates members with sequential register numbers within one batch', async () => {
    mockSession = {
      user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
    }

    const result = await bulkCreateMembersAction({
      members: [baseMember('A'), baseMember('B'), baseMember('C')],
      organizationId: pkItbId
    })

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(3)

    const registerNumbers = (result.data ?? [])
      .map((c) => c.registerNumber)
      .sort()
    expect(registerNumbers).toEqual([
      '19012024001',
      '19012024002',
      '19012024003'
    ])

    for (const credential of result.data ?? []) {
      const [account] = await db
        .select({ passwordHash: userTable.passwordHash })
        .from(userTable)
        .where(eq(userTable.name, credential.registerNumber))

      expect(
        await Bun.password.verify(
          credential.password,
          account?.passwordHash ?? ''
        )
      ).toBe(true)
    }
  })

  it('continues sequential numbering from existing members in the same org/year', async () => {
    mockSession = {
      user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
    }

    const first = await bulkCreateMembersAction({
      members: [baseMember('A')],
      organizationId: pkItbId
    })
    expect(first.data?.[0]?.registerNumber).toBe('19012024001')

    const second = await bulkCreateMembersAction({
      members: [baseMember('B')],
      organizationId: pkItbId
    })
    expect(second.data?.[0]?.registerNumber).toBe('19012024002')
  })

  it('allows root to bulk upload into any org', async () => {
    mockSession = { user: { id: 'u1', role: 'root' } }

    const result = await bulkCreateMembersAction({
      members: [baseMember('A')],
      organizationId: pkOtherId
    })

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
  })

  it('rolls back the whole batch when a later member in the same batch fails to insert', async () => {
    mockSession = {
      user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
    }

    // Pre-seed a login name that collides with the register number the
    // second member in this batch would be assigned, forcing that insert
    // to violate user.name's unique constraint mid-transaction.
    await db.insert(userTable).values({
      name: '19012024002',
      displayName: 'Kolisi',
      passwordHash: 'x',
      role: 'member'
    })

    const result = await bulkCreateMembersAction({
      members: [baseMember('A'), baseMember('B')],
      organizationId: pkItbId
    })

    expect(result.success).toBe(false)

    const created = await db
      .select()
      .from(memberTable)
      .where(eq(memberTable.organizationId, pkItbId))
    expect(created).toHaveLength(0)
  })

  it('rejects the whole batch when the organization cannot be resolved', async () => {
    mockSession = { user: { id: 'u1', role: 'root' } }

    const result = await bulkCreateMembersAction({
      members: [baseMember('A')],
      organizationId: '00000000-0000-0000-0000-000000000000'
    })

    expect(result.success).toBe(false)
  })
})
