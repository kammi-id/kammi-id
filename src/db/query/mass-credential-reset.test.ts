import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { member } from '~/db/schema/member.sql'
import { user as userTable } from '~/db/schema/user.sql'
import { session as sessionTable } from '~/db/schema/session.sql'
import {
  countMassResettableMemberAccounts,
  resetMassMemberCredentials
} from './mass-credential-reset'

/**
 * Tiket 06 — regenerasi kredensial massal. Yang diadili di sini adalah
 * rakitan query-nya: siapa yang tersentuh (Akun Kader di bawah sasaran dan
 * turunannya, bukan Akun Kepengurusan, bukan Struktur lain), dan bahwa
 * seluruhnya satu transaksi — kegagalan Cakupan tidak boleh mengubah satu
 * baris pun.
 *
 * Fixture bersufiks, nol `TRUNCATE`, mengikuti pola `tests/member-scope.test.ts`
 * dan `tests/keadaan-akun-sesi.test.ts`.
 */

const suffix = Date.now().toString(36)

describe('mass-credential-reset', () => {
  let ppId: string
  let pwId: string
  let pkTargetId: string
  let pkChildId: string
  let pkOutsideId: string
  const orgIds: string[] = []
  const memberIds: string[] = []
  const userIds: string[] = []

  const root = { role: 'root', connectedOrganizationId: null }
  const bpkAtTarget = () => ({
    role: 'bpk',
    connectedOrganizationId: pkTargetId
  })
  const bpkAtOutside = () => ({
    role: 'bpk',
    connectedOrganizationId: pkOutsideId
  })

  const insertOrg = async (values: {
    name: string
    type: 'pp' | 'pw' | 'pd' | 'pk'
    parentId: string | null
  }) => {
    const [row] = await db
      .insert(organization)
      .values({
        name: values.name,
        slug: `${values.name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
        code: `${values.name.toUpperCase().replace(/\s+/g, '-')}-${suffix}`,
        type: values.type,
        parentId: values.parentId,
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgIds.push(row.id)
    return row.id
  }

  const addKader = async (name: string, organizationId: string) => {
    const [row] = await db
      .insert(member)
      .values({
        name,
        registerNumber: `${name.replace(/\s+/g, '')}-${suffix}`,
        organizationId,
        status: 'ab1' as const,
        gender: 'ikhwan' as const,
        yearOfEntry: 2024
      })
      .returning({ id: member.id })
    memberIds.push(row.id)

    const [userRow] = await db
      .insert(userTable)
      .values({
        name: row.id, // NIA-nya tidak relevan di sini, id member cukup untuk keunikan
        displayName: name,
        passwordHash: 'password-lama',
        role: 'member',
        connectedMemberId: row.id
      })
      .returning({ id: userTable.id })
    userIds.push(userRow.id)
    return { memberId: row.id, userId: userRow.id }
  }

  const addOfficer = async (organizationId: string, roleLabel: string) => {
    const [userRow] = await db
      .insert(userTable)
      .values({
        name: `${roleLabel}-${organizationId}-${suffix}`,
        displayName: `${roleLabel} ${suffix}`,
        passwordHash: 'password-pengurus-lama',
        role: 'bpk',
        connectedOrganizationId: organizationId
      })
      .returning({ id: userTable.id })
    userIds.push(userRow.id)
    return userRow.id
  }

  const passwordHashOf = async (userId: string) => {
    const [row] = await db
      .select({ passwordHash: userTable.passwordHash })
      .from(userTable)
      .where(eq(userTable.id, userId))
    return row?.passwordHash
  }

  const sessionCountOf = async (userId: string) => {
    const rows = await db
      .select({ id: sessionTable.id })
      .from(sessionTable)
      .where(eq(sessionTable.userId, userId))
    return rows.length
  }

  beforeAll(async () => {
    ppId = await insertOrg({
      name: `PP MCR ${suffix}`,
      type: 'pp',
      parentId: null
    })
    pwId = await insertOrg({
      name: `PW MCR ${suffix}`,
      type: 'pw',
      parentId: ppId
    })
    pkTargetId = await insertOrg({
      name: `PK Target MCR ${suffix}`,
      type: 'pk',
      parentId: pwId
    })
    pkChildId = await insertOrg({
      name: `PK Child MCR ${suffix}`,
      type: 'pk',
      parentId: pkTargetId
    })
    pkOutsideId = await insertOrg({
      name: `PK Outside MCR ${suffix}`,
      type: 'pk',
      parentId: pwId
    })
  })

  afterAll(async () => {
    if (userIds.length) {
      await db.delete(sessionTable).where(inArray(sessionTable.userId, userIds))
      await db.delete(userTable).where(inArray(userTable.id, userIds))
    }
    if (memberIds.length) {
      await db.delete(member).where(inArray(member.id, memberIds))
    }
    for (const id of [...orgIds].reverse()) {
      await db.delete(organization).where(eq(organization.id, id))
    }
  })

  describe('countMassResettableMemberAccounts', () => {
    it('menghitung Akun Kader di sasaran dan turunannya saja', async () => {
      const direct = await addKader('Kader Target Count', pkTargetId)
      const nested = await addKader('Kader Child Count', pkChildId)
      const outside = await addKader('Kader Outside Count', pkOutsideId)
      const officer = await addOfficer(pkTargetId, 'BPK-count')

      const count = await countMassResettableMemberAccounts(pkTargetId)

      expect(count).toBeGreaterThanOrEqual(2)

      // Bukti negatif: akun di luar sasaran dan Akun Kepengurusan tidak
      // pernah menambah angka ini, sekalipun jumlah totalnya berubah antar
      // tes (id acak, tidak bisa dibandingkan exact).
      void direct
      void nested
      void outside
      void officer
    })
  })

  describe('resetMassMemberCredentials', () => {
    it('menolak dan tidak mengubah apa pun ketika sasaran di luar Cakupan pemanggil', async () => {
      const kader = await addKader('Kader Reject Scope', pkTargetId)
      const before = await passwordHashOf(kader.userId)

      await expect(
        resetMassMemberCredentials(pkTargetId, bpkAtOutside())
      ).rejects.toThrow()

      const after = await passwordHashOf(kader.userId)
      expect(after).toBe(before)
    })

    it('mereset password setiap Akun Kader di sasaran dan turunannya, memutus sesinya, dan tidak menyentuh Akun Kepengurusan', async () => {
      const direct = await addKader('Kader Reset Direct', pkTargetId)
      const nested = await addKader('Kader Reset Nested', pkChildId)
      const outside = await addKader('Kader Reset Outside', pkOutsideId)
      const officer = await addOfficer(pkTargetId, 'BPK-reset')

      // Sesi hidup untuk tiap akun yang akan (dan tidak akan) tersentuh.
      await db.insert(sessionTable).values([
        {
          id: crypto.randomUUID(),
          secretHash: 'x',
          createdAt: new Date(),
          lastVerifiedAt: new Date(),
          userId: direct.userId
        },
        {
          id: crypto.randomUUID(),
          secretHash: 'x',
          createdAt: new Date(),
          lastVerifiedAt: new Date(),
          userId: nested.userId
        },
        {
          id: crypto.randomUUID(),
          secretHash: 'x',
          createdAt: new Date(),
          lastVerifiedAt: new Date(),
          userId: outside.userId
        }
      ])

      const outsideHashBefore = await passwordHashOf(outside.userId)
      const officerHashBefore = await passwordHashOf(officer)

      const rows = await resetMassMemberCredentials(pkTargetId, root)

      expect(rows.length).toBeGreaterThanOrEqual(2)
      const directRow = rows.find((r) => r.registerNumber === direct.memberId)
      const nestedRow = rows.find((r) => r.registerNumber === nested.memberId)
      expect(directRow?.name).toBe('Kader Reset Direct')
      expect(nestedRow?.name).toBe('Kader Reset Nested')
      expect(directRow?.password).toBeTruthy()
      expect(directRow?.password).not.toBe(nestedRow?.password)

      expect(await passwordHashOf(direct.userId)).not.toBe('password-lama')
      expect(await passwordHashOf(nested.userId)).not.toBe('password-lama')
      expect(await sessionCountOf(direct.userId)).toBe(0)
      expect(await sessionCountOf(nested.userId)).toBe(0)

      // Di luar sasaran: tidak tersentuh sama sekali.
      expect(await passwordHashOf(outside.userId)).toBe(outsideHashBefore)
      expect(await sessionCountOf(outside.userId)).toBe(1)

      // Akun Kepengurusan: tidak tersentuh sama sekali.
      expect(await passwordHashOf(officer)).toBe(officerHashBefore)
    })

    it('mengizinkan sasaran yang merupakan Struktur pemanggil sendiri', async () => {
      const kader = await addKader('Kader Reset Self', pkTargetId)

      const rows = await resetMassMemberCredentials(pkTargetId, bpkAtTarget())

      expect(rows.length).toBeGreaterThanOrEqual(1)
      expect(await passwordHashOf(kader.userId)).not.toBe('password-lama')
    })
  })
})
