import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { inArray, eq } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { member } from '~/db/schema/member.sql'
import { user as userTable } from '~/db/schema/user.sql'
import {
  readMemberDistributionByOrgType,
  updateMember,
  createMember
} from './member'

/**
 * Tiket 07 (dashboard BPK: Top 10 + deleted_at). Fixture bersufiks,
 * dibereskan sendiri — berkas ini menyentuh basis data staging bersama,
 * jadi tidak memakai TRUNCATE (bisa menabrak berkas tes lain yang jalan
 * di worktree paralel).
 */
describe('readMemberDistributionByOrgType', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []
  const memberIds: string[] = []

  const seedOrg = async (name: string, code: string) => {
    const [row] = await db
      .insert(organization)
      .values({
        name: `${name} ${suffix}`,
        slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
        code,
        type: 'pw',
        parentId: null,
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgIds.unshift(row.id)
    return row.id
  }

  const seedMember = async (
    organizationId: string,
    registerNumber: string,
    overrides: Partial<typeof member.$inferInsert> = {}
  ) => {
    const [row] = await db
      .insert(member)
      .values({
        name: `Kader Uji ${registerNumber}`,
        registerNumber,
        organizationId,
        status: 'ab1',
        gender: 'ikhwan',
        yearOfEntry: 2026,
        ...overrides
      })
      .returning({ id: member.id })
    memberIds.unshift(row.id)
    return row.id
  }

  afterAll(async () => {
    if (memberIds.length > 0)
      await db.delete(member).where(inArray(member.id, memberIds))
    if (orgIds.length > 0)
      await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  describe('Top 10 (LIMIT di SQL)', () => {
    const topSuffix = `top-${suffix}`
    const seededOrgs: { id: string; count: number }[] = []

    beforeAll(async () => {
      // 15 org PW dengan jumlah Kader berbeda (1..15) supaya peringkat
      // top-10 tidak ambigu.
      for (let i = 0; i < 15; i++) {
        const count = i + 1
        const orgId = await seedOrg(
          `Org Top ${topSuffix} ${count}`,
          `OT-${topSuffix}-${count}`
        )
        for (let m = 0; m < count; m++) {
          await seedMember(orgId, `RN-${topSuffix}-${count}-${m}`)
        }
        seededOrgs.push({ id: orgId, count })
      }
    })

    it('mengembalikan maksimal 10 baris meski 15 org memenuhi syarat', async () => {
      const result = await readMemberDistributionByOrgType(
        'pw',
        seededOrgs.map((o) => o.id)
      )

      expect(result.length).toBe(10)
    })

    it('10 baris yang dikembalikan adalah top-10 berdasarkan jumlah Kader, bukan 10 sembarang', async () => {
      const result = await readMemberDistributionByOrgType(
        'pw',
        seededOrgs.map((o) => o.id)
      )

      const expectedTop10Ids = [...seededOrgs]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map((o) => o.id)

      expect(new Set(result.map((r) => r.organizationId))).toEqual(
        new Set(expectedTop10Ids)
      )
      // org dengan 1..5 Kader (peringkat 11-15) tidak boleh muncul.
      const excludedIds = seededOrgs
        .filter((o) => o.count <= 5)
        .map((o) => o.id)
      for (const id of excludedIds) {
        expect(result.map((r) => r.organizationId)).not.toContain(id)
      }
    })
  })

  describe('Kader ber-deleted_at tidak ikut terhitung', () => {
    let orgId: string

    beforeAll(async () => {
      orgId = await seedOrg(`Org Deleted ${suffix}`, `OD-${suffix}`)
      await seedMember(orgId, `RN-DEL-${suffix}-1`)
      await seedMember(orgId, `RN-DEL-${suffix}-2`)
      await seedMember(orgId, `RN-DEL-${suffix}-3`, {
        deletedAt: new Date()
      })
    })

    it('mengecualikan Kader terhapus dari total dan peringkat', async () => {
      const result = await readMemberDistributionByOrgType('pw', [orgId])

      const row = result.find((r) => r.organizationId === orgId)
      expect(row).toBeDefined()
      expect(row?.total).toBe(2)
    })
  })
})

/**
 * ADR 0027, "Sekalian" — `user.displayName` mengikuti `member.name`.
 * `createMember` menyemainya dari sana saat Akun Kader dibuat; tanpa
 * `updateMember` menulis ulang `displayName` setiap kali `name` berubah, ia
 * basi selamanya di sidebar begitu Kader mengoreksi namanya sendiri.
 *
 * Fixture bersufiks, dibereskan sendiri di `afterAll` — berkas ini
 * menyentuh basis data staging bersama, jadi tidak memakai TRUNCATE.
 */
describe('updateMember — displayName mengikuti name', () => {
  const suffix = Date.now().toString(36) + '-dn'
  const orgIds: string[] = []
  const memberIds: string[] = []

  afterAll(async () => {
    if (memberIds.length > 0)
      await db.delete(member).where(inArray(member.id, memberIds))
    if (orgIds.length > 0)
      await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  let orgCounter = 0
  const seedOrgForDisplayName = async () => {
    orgCounter += 1
    const unique = `${suffix}-${orgCounter}`
    const [row] = await db
      .insert(organization)
      .values({
        name: `Org DN ${unique}`,
        slug: `org-dn-${unique}`,
        code: `DN-${unique}`,
        type: 'pk',
        parentId: null,
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgIds.unshift(row.id)
    return row.id
  }

  it('menulis ulang displayName Akun yang terhubung saat member.name berubah', async () => {
    const orgId = await seedOrgForDisplayName()
    const [created] = await createMember({
      name: `Nama Lama ${suffix}`,
      registerNumber: `RN-DN-${suffix}`,
      organizationId: orgId,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2026
    })
    memberIds.unshift(created.id)

    await updateMember({ name: `Nama Baru ${suffix}` }, created.id)

    const [connectedUser] = await db
      .select({ displayName: userTable.displayName })
      .from(userTable)
      .where(eq(userTable.connectedMemberId, created.id))

    expect(connectedUser?.displayName).toBe(`Nama Baru ${suffix}`)
  })

  it('tidak menyentuh displayName saat name tidak ikut ditulis', async () => {
    const orgId = await seedOrgForDisplayName()
    const [created] = await createMember({
      name: `Nama Tetap ${suffix}`,
      registerNumber: `RN-DN2-${suffix}`,
      organizationId: orgId,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2026
    })
    memberIds.unshift(created.id)

    await updateMember({ phone: '08123456789' }, created.id)

    const [connectedUser] = await db
      .select({ displayName: userTable.displayName })
      .from(userTable)
      .where(eq(userTable.connectedMemberId, created.id))

    expect(connectedUser?.displayName).toBe(`Nama Tetap ${suffix}`)
  })
})
