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

const { updateMemberAction } = await import('./action')

const ACTOR_ID = '11111111-1111-1111-1111-111111111111'

describe('updateMemberAction — mutasi gating on organizationId (ADR 0020)', () => {
  let ppId: string
  let pwJabarId: string
  let pkItbId: string
  let pkItbSiblingId: string
  let pkOtherId: string

  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE "user", "member", "member_mutation", organization CASCADE`
    )
    mockSession = undefined

    const [pp] = await createOrganization({
      name: 'PP KAMMI',
      slug: 'pp-kammi-update-action',
      code: 'PP-00',
      type: 'pp',
      parentId: null,
      isNonActive: false
    })
    ppId = pp.id

    const [pwJabar] = await createOrganization({
      name: 'PW Jabar',
      slug: 'pw-jabar-update-action',
      code: 'PW-01',
      type: 'pw',
      parentId: pp.id,
      isNonActive: false
    })
    pwJabarId = pwJabar.id

    const [pwJatim] = await createOrganization({
      name: 'PW Jatim',
      slug: 'pw-jatim-update-action',
      code: 'PW-02',
      type: 'pw',
      parentId: pp.id,
      isNonActive: false
    })

    const [pkItb] = await createOrganization({
      name: 'PK ITB',
      slug: 'pk-itb-update-action',
      code: 'PK-01',
      type: 'pk',
      parentId: pwJabar.id,
      isNonActive: false
    })
    pkItbId = pkItb.id

    const [pkItbSibling] = await createOrganization({
      name: 'PK Sibling di PW Jabar',
      slug: 'pk-itb-sibling-update-action',
      code: 'PK-03',
      type: 'pk',
      parentId: pwJabar.id,
      isNonActive: false
    })
    pkItbSiblingId = pkItbSibling.id

    const [pkOther] = await createOrganization({
      name: 'PK Other',
      slug: 'pk-other-update-action',
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
      status: 'ab2',
      gender: 'ikhwan',
      yearOfEntry: 2020
    })
    return created
  }

  const formDataFor = (
    memberId: string,
    organizationId: string,
    overrides: Partial<Record<string, string>> = {}
  ) => {
    const fd = new FormData()
    fd.append('id', memberId)
    fd.append('name', overrides.name ?? 'Anggota Test')
    fd.append('gender', 'ikhwan')
    fd.append('status', 'ab2')
    fd.append('yearOfEntry', '2020')
    fd.append('organizationId', organizationId)
    fd.append('isAlumn', 'false')
    fd.append('isSuspended', 'false')
    fd.append('isNonActive', 'false')
    fd.append('isCertifiedMentor', 'false')
    fd.append('isCertifiedInstructor', 'false')
    return fd
  }

  it('lets a plain bpk edit fields without touching organizationId', async () => {
    mockSession = {
      user: {
        id: ACTOR_ID,
        role: 'bpk',
        connectedOrganization: { id: pkItbId }
      }
    }
    const member = await createTestMember(pkItbId)

    const formData = formDataFor(member.id, pkItbId, { name: 'Nama Baru' })
    const result = await updateMemberAction({}, formData)

    expect(result.success).toBe(true)
    const [updated] = await readMember({ id: [member.id] })
    expect(updated.name).toBe('Nama Baru')
    expect(updated.organizationId).toBe(pkItbId)
  })

  it('rejects an organizationId change from a bpk pk — not root/bpk-pp', async () => {
    mockSession = {
      user: {
        id: ACTOR_ID,
        role: 'bpk',
        connectedOrganization: { id: pkItbId }
      }
    }
    const member = await createTestMember(pkItbId)

    const formData = formDataFor(member.id, pkOtherId)
    const result = await updateMemberAction({}, formData)

    expect(result.success).toBe(false)

    const [stillHere] = await readMember({ id: [member.id] })
    expect(stillHere.organizationId).toBe(pkItbId)

    const rows = await db.execute(
      sql`SELECT id FROM member_mutation WHERE member_id = ${member.id}`
    )
    expect(rows.length).toBe(0)
  })

  it('rejects an organizationId change from a bpk pd, even to a destination inside its own cakupan', async () => {
    mockSession = {
      user: {
        id: ACTOR_ID,
        role: 'bpk',
        connectedOrganization: { id: pwJabarId }
      }
    }
    const member = await createTestMember(pkItbId)

    // Both pkItbId and pkItbSiblingId sit under this same bpk's own pwJabarId
    // cakupan — the pre-existing "in scope" check alone would let this
    // through. It is `requireMemberMutationAccess` specifically, not scope,
    // that has to reject it: mutasi is Root/BPK-PP only, full stop.
    const formData = formDataFor(member.id, pkItbSiblingId)
    const result = await updateMemberAction({}, formData)

    expect(result.success).toBe(false)

    const [stillHere] = await readMember({ id: [member.id] })
    expect(stillHere.organizationId).toBe(pkItbId)
  })

  it('lets root change organizationId, and records exactly one member_mutation row', async () => {
    mockSession = { user: { id: ACTOR_ID, role: 'root' } }
    const member = await createTestMember(pkItbId)

    const formData = formDataFor(member.id, pkOtherId, { name: 'Nama Baru' })
    const result = await updateMemberAction({}, formData)

    expect(result.success).toBe(true)

    const [moved] = await readMember({ id: [member.id] })
    expect(moved.organizationId).toBe(pkOtherId)
    expect(moved.name).toBe('Nama Baru')
    expect(moved.registerNumber).toBe(member.registerNumber)

    const rows = await db.execute(
      sql`SELECT from_organization_id, to_organization_id, moved_by
          FROM member_mutation WHERE member_id = ${member.id}`
    )
    expect(rows.length).toBe(1)
    expect(rows[0].from_organization_id).toBe(pkItbId)
    expect(rows[0].to_organization_id).toBe(pkOtherId)
    expect(rows[0].moved_by).toBe(ACTOR_ID)
  })

  it('lets bpk pp change organizationId', async () => {
    mockSession = {
      user: { id: ACTOR_ID, role: 'bpk', connectedOrganization: { id: ppId } }
    }
    const member = await createTestMember(pkItbId)

    const formData = formDataFor(member.id, pkOtherId)
    const result = await updateMemberAction({}, formData)

    expect(result.success).toBe(true)
    const [moved] = await readMember({ id: [member.id] })
    expect(moved.organizationId).toBe(pkOtherId)
  })

  it('does not record a mutation row when organizationId is unchanged', async () => {
    mockSession = { user: { id: ACTOR_ID, role: 'root' } }
    const member = await createTestMember(pkItbId)

    const formData = formDataFor(member.id, pkItbId, { name: 'Nama Baru' })
    const result = await updateMemberAction({}, formData)

    expect(result.success).toBe(true)
    const rows = await db.execute(
      sql`SELECT id FROM member_mutation WHERE member_id = ${member.id}`
    )
    expect(rows.length).toBe(0)
  })
})
