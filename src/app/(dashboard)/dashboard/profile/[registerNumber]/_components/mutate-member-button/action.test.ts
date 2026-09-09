import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import { createOrganization } from '~/db/query/organization'
import { createMember, readMember } from '~/db/query/member'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { mutateMemberAction } = await import('./action')

describe('mutateMemberAction', () => {
  let pkItbId: string
  let pkOtherId: string
  let pwJabarId: string

  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE "user", "member", "member_mutation", organization CASCADE`
    )
    mockSession = undefined

    const [pp] = await createOrganization({
      name: 'PP KAMMI',
      slug: 'pp-kammi-mutate-btn',
      code: 'PP-00',
      type: 'pp',
      parentId: null,
      isNonActive: false
    })

    const [pwJabar] = await createOrganization({
      name: 'PW Jabar',
      slug: 'pw-jabar-mutate-btn',
      code: 'PW-01',
      type: 'pw',
      parentId: pp.id,
      isNonActive: false
    })
    pwJabarId = pwJabar.id

    const [pwJatim] = await createOrganization({
      name: 'PW Jatim',
      slug: 'pw-jatim-mutate-btn',
      code: 'PW-02',
      type: 'pw',
      parentId: pp.id,
      isNonActive: false
    })

    const [pkItb] = await createOrganization({
      name: 'PK ITB',
      slug: 'pk-itb-mutate-btn',
      code: 'PK-01',
      type: 'pk',
      parentId: pwJabar.id,
      isNonActive: false
    })
    pkItbId = pkItb.id

    const [pkOther] = await createOrganization({
      name: 'PK Other',
      slug: 'pk-other-mutate-btn',
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

  it('rejects when there is no active session', async () => {
    mockSession = undefined
    const member = await createTestMember(pkItbId)

    const result = await mutateMemberAction(member.id, pkOtherId)

    expect(result.success).toBe(false)

    const [stillHere] = await readMember({ id: [member.id] })
    expect(stillHere.organizationId).toBe(pkItbId)
  })

  it('rejects a bpk pd — mutasi is root/bpk-pp only', async () => {
    mockSession = {
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        role: 'bpk',
        connectedOrganization: { id: pwJabarId }
      }
    }
    const member = await createTestMember(pkItbId)

    const result = await mutateMemberAction(member.id, pkOtherId)

    expect(result.success).toBe(false)

    const [stillHere] = await readMember({ id: [member.id] })
    expect(stillHere.organizationId).toBe(pkItbId)
  })

  it('rejects a bpk pk, deeper below pp than a bpk pd', async () => {
    mockSession = {
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        role: 'bpk',
        connectedOrganization: { id: pkItbId }
      }
    }
    const member = await createTestMember(pkItbId)

    const result = await mutateMemberAction(member.id, pkOtherId)

    expect(result.success).toBe(false)
  })

  it('rejects moving to the struktur the member is already in', async () => {
    mockSession = {
      user: { id: '11111111-1111-1111-1111-111111111111', role: 'root' }
    }
    const member = await createTestMember(pkItbId)

    const result = await mutateMemberAction(member.id, pkItbId)

    expect(result.success).toBe(false)
  })

  it('rejects a member that does not exist', async () => {
    mockSession = {
      user: { id: '11111111-1111-1111-1111-111111111111', role: 'root' }
    }

    const result = await mutateMemberAction(
      '00000000-0000-0000-0000-000000000000',
      pkOtherId
    )

    expect(result.success).toBe(false)
  })

  it('lets root mutate, changing the struktur and recording it, and leaves NIA untouched', async () => {
    mockSession = {
      user: { id: '11111111-1111-1111-1111-111111111111', role: 'root' }
    }
    const member = await createTestMember(pkItbId)

    const result = await mutateMemberAction(member.id, pkOtherId)

    expect(result.success).toBe(true)

    const [moved] = await readMember({ id: [member.id] })
    expect(moved.organizationId).toBe(pkOtherId)
    expect(moved.registerNumber).toBe(member.registerNumber)

    const rows = await db.execute(
      sql`SELECT member_id, from_organization_id, to_organization_id, moved_by
          FROM member_mutation WHERE member_id = ${member.id}`
    )
    expect(rows.length).toBe(1)
    expect(rows[0].from_organization_id).toBe(pkItbId)
    expect(rows[0].to_organization_id).toBe(pkOtherId)
    expect(rows[0].moved_by).toBe('11111111-1111-1111-1111-111111111111')
  })

  it('lets bpk pp mutate', async () => {
    const [pp] = await db.execute(
      sql`SELECT id FROM organization WHERE type = 'pp' LIMIT 1`
    )
    mockSession = {
      user: {
        id: '11111111-1111-1111-1111-111111111111',
        role: 'bpk',
        connectedOrganization: { id: pp.id }
      }
    }
    const member = await createTestMember(pkItbId)

    const result = await mutateMemberAction(member.id, pkOtherId)

    expect(result.success).toBe(true)
    const [moved] = await readMember({ id: [member.id] })
    expect(moved.organizationId).toBe(pkOtherId)
  })

  it('leaves exactly one mutation row per mutation, not per attempt', async () => {
    mockSession = {
      user: { id: '11111111-1111-1111-1111-111111111111', role: 'root' }
    }
    const member = await createTestMember(pkItbId)

    await mutateMemberAction(member.id, pkOtherId)
    await mutateMemberAction(member.id, pkItbId)

    const rows = await db.execute(
      sql`SELECT id FROM member_mutation WHERE member_id = ${member.id}`
    )
    expect(rows.length).toBe(2)
  })
})
