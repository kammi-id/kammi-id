import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  mock
} from 'bun:test'
import { db } from '~/db/db'
import { eq, inArray } from 'drizzle-orm'
import { organization } from '~/db/schema/organization.sql'
import { user as userTable } from '~/db/schema/user.sql'
import { member } from '~/db/schema/member.sql'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { restoreMemberAction } = await import('./action')

/**
 * ADR 0021 Lapis 2 — **mengikuti Cakupan**, bukan terpusat seperti restore
 * Struktur. Yang paling penting dibuktikan di sini: seorang BPK PD hanya
 * pernah melihat/memulihkan Kader Terhapus di dalam Cakupannya sendiri.
 */
describe('pemulihan Kader Terhapus', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []
  const memberIds: string[] = []
  let actorId: string
  let ppId: string
  let pd1Id: string
  let pk1Id: string
  let pd2Id: string
  let pk2Id: string

  const seedOrg = async (
    name: string,
    code: string,
    type: 'pp' | 'pw' | 'pd' | 'pk',
    parentId: string | null
  ) => {
    const [row] = await db
      .insert(organization)
      .values({
        name: `${name} ${suffix}`,
        slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
        code,
        type,
        parentId,
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgIds.push(row.id)
    return row.id
  }

  const seedDeletedMember = async (
    name: string,
    registerNumber: string,
    organizationId: string
  ) => {
    const [row] = await db
      .insert(member)
      .values({
        name,
        organizationId,
        registerNumber,
        status: 'ab1',
        gender: 'ikhwan',
        yearOfEntry: 2020,
        deletedAt: new Date()
      })
      .returning({ id: member.id })
    memberIds.push(row.id)

    await db.insert(userTable).values({
      name: registerNumber,
      displayName: name,
      passwordHash: 'x',
      role: 'member',
      connectedMemberId: row.id,
      deletedAt: new Date()
    })

    return row.id
  }

  const readMemberState = async (id: string) => {
    const [row] = await db
      .select({ deletedAt: member.deletedAt })
      .from(member)
      .where(eq(member.id, id))
    return row
  }

  const readAccountDeletedAt = async (memberId: string) => {
    const [row] = await db
      .select({ deletedAt: userTable.deletedAt })
      .from(userTable)
      .where(eq(userTable.connectedMemberId, memberId))
    return row?.deletedAt
  }

  const sessionOf = (role: string, organizationId: string | null) => ({
    user: {
      id: actorId,
      role,
      connectedOrganization: organizationId ? { id: organizationId } : null,
      connectedMember: null
    }
  })

  beforeAll(async () => {
    const [actor] = await db
      .insert(userTable)
      .values({
        name: `pelaku-pulihkan-kader-${suffix}`,
        displayName: `Pelaku Pulihkan Kader ${suffix}`,
        passwordHash: 'x',
        role: 'root'
      })
      .returning({ id: userTable.id })
    actorId = actor.id

    ppId = await seedOrg('PP Pulihkan Kader', `PP-PLH-${suffix}`, 'pp', null)
    pd1Id = await seedOrg('PD Satu Pulihkan', `PD1-PLH-${suffix}`, 'pd', ppId)
    pk1Id = await seedOrg('PK Satu Pulihkan', `PK1-PLH-${suffix}`, 'pk', pd1Id)
    pd2Id = await seedOrg('PD Dua Pulihkan', `PD2-PLH-${suffix}`, 'pd', ppId)
    pk2Id = await seedOrg('PK Dua Pulihkan', `PK2-PLH-${suffix}`, 'pk', pd2Id)
  })

  afterAll(async () => {
    if (memberIds.length) {
      await db
        .delete(userTable)
        .where(inArray(userTable.connectedMemberId, memberIds))
      await db.delete(member).where(inArray(member.id, memberIds))
    }
    await db.delete(organization).where(inArray(organization.id, orgIds))
    await db.delete(userTable).where(eq(userTable.id, actorId))
  })

  beforeEach(() => {
    mockSession = sessionOf('root', null)
  })

  it('menolak tanpa sesi', async () => {
    const memberId = await seedDeletedMember(
      `Kader Tanpa Sesi ${suffix}`,
      `KDR-TS-${suffix}`,
      pk1Id
    )
    mockSession = undefined

    const result = await restoreMemberAction(memberId)

    expect(result.success).toBe(false)
    expect((await readMemberState(memberId))?.deletedAt).not.toBeNull()
  })

  it('menolak BPH, BPW, dan Humas', async () => {
    const memberId = await seedDeletedMember(
      `Kader Gate Lain ${suffix}`,
      `KDR-GL-${suffix}`,
      pk1Id
    )
    for (const role of ['bph', 'bpw', 'humas']) {
      mockSession = sessionOf(role, ppId)
      const result = await restoreMemberAction(memberId)
      expect(result.success).toBe(false)
    }
    expect((await readMemberState(memberId))?.deletedAt).not.toBeNull()
  })

  it('menolak BPK PD memulihkan Kader di luar Cakupannya', async () => {
    const memberId = await seedDeletedMember(
      `Kader Luar Cakupan ${suffix}`,
      `KDR-LC-${suffix}`,
      pk2Id
    )
    mockSession = sessionOf('bpk', pd1Id)

    const result = await restoreMemberAction(memberId)

    expect(result.success).toBe(false)
    expect(result.message).toContain('di luar Cakupan')
    expect((await readMemberState(memberId))?.deletedAt).not.toBeNull()
  })

  it('mengizinkan BPK PD memulihkan Kader dalam Cakupannya sendiri, Akun ikut', async () => {
    const memberId = await seedDeletedMember(
      `Kader Dalam Cakupan ${suffix}`,
      `KDR-DC-${suffix}`,
      pk1Id
    )
    mockSession = sessionOf('bpk', pd1Id)

    const result = await restoreMemberAction(memberId)

    expect(result.success).toBe(true)
    expect((await readMemberState(memberId))?.deletedAt).toBeNull()
    expect(await readAccountDeletedAt(memberId)).toBeNull()
  })

  it('mengizinkan Root memulihkan Kader di mana pun', async () => {
    const memberId = await seedDeletedMember(
      `Kader Root ${suffix}`,
      `KDR-RT-${suffix}`,
      pk2Id
    )
    mockSession = sessionOf('root', null)

    const result = await restoreMemberAction(memberId)

    expect(result.success).toBe(true)
    expect((await readMemberState(memberId))?.deletedAt).toBeNull()
  })
})
