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

const { deleteMemberAction } = await import('./action')

describe('deleteMemberAction', () => {
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

  it('rejects when there is no active session', async () => {
    mockSession = undefined
    const member = await createTestMember(pkItbId)

    const result = await deleteMemberAction(member.id, member.registerNumber)

    expect(result.success).toBe(false)
    expect(result.message).toBe('Tidak terautentikasi')
  })

  it('rejects for a role outside the mutation allowlist', async () => {
    mockSession = { user: { id: 'u1', role: 'humas' } }
    const member = await createTestMember(pkItbId)

    const result = await deleteMemberAction(member.id, member.registerNumber)

    expect(result.success).toBe(false)
    expect(result.message).toBe('Role tidak diizinkan untuk aksi ini')

    const stillThere = await readMember({ id: [member.id] })
    expect(stillThere).toHaveLength(1)
  })

  it('rejects a bpk deleting a member outside their org scope', async () => {
    mockSession = {
      user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
    }
    const member = await createTestMember(pkOtherId)

    const result = await deleteMemberAction(member.id, member.registerNumber)

    expect(result.success).toBe(false)
    expect(result.message).toBe('Kader ini bukan dalam scope organisasi antum')

    const stillThere = await readMember({ id: [member.id] })
    expect(stillThere).toHaveLength(1)
  })

  it('rejects when the confirmation register number does not match', async () => {
    mockSession = {
      user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
    }
    const member = await createTestMember(pkItbId)

    const result = await deleteMemberAction(member.id, 'SALAH-0000')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Nomor anggota yang dimasukkan tidak sesuai')

    const stillThere = await readMember({ id: [member.id] })
    expect(stillThere).toHaveLength(1)
  })

  it('deletes the member when role, scope, and confirmation all pass', async () => {
    mockSession = {
      user: { id: 'u1', role: 'bpk', connectedOrganizationId: pkItbId }
    }
    const member = await createTestMember(pkItbId)

    const result = await deleteMemberAction(member.id, member.registerNumber)

    expect(result.success).toBe(true)

    const afterDelete = await readMember({ id: [member.id] })
    expect(afterDelete).toHaveLength(0)
  })

  it('allows root to delete a member in any org', async () => {
    mockSession = { user: { id: 'u1', role: 'root' } }
    const member = await createTestMember(pkOtherId)

    const result = await deleteMemberAction(member.id, member.registerNumber)

    expect(result.success).toBe(true)
    const afterDelete = await readMember({ id: [member.id] })
    expect(afterDelete).toHaveLength(0)
  })

  it('rejects deleting a member that does not exist', async () => {
    mockSession = { user: { id: 'u1', role: 'root' } }

    const result = await deleteMemberAction(
      '00000000-0000-0000-0000-000000000000',
      'whatever'
    )

    expect(result.success).toBe(false)
    expect(result.message).toBe('Kader tidak ditemukan')
  })
})
