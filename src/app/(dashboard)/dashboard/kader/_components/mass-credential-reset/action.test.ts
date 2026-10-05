import { describe, it, expect, beforeAll, afterAll, mock } from 'bun:test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { member } from '~/db/schema/member.sql'
import { user as userTable } from '~/db/schema/user.sql'
import { session as sessionTable } from '~/db/schema/session.sql'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

const { regenerateMassCredentialsAction } = await import('./action')

/**
 * Tiket 06, langsung dari daftar "Uji" spec-nya: sasaran di luar Cakupan
 * ditolak, BPH ditolak, password pengurus salah ditolak **dan nol baris
 * berubah**, dan sukses mengubah setiap `password_hash` di sasaran +
 * turunan, menghapus setiap sesinya, dan tidak menyentuh Akun Kepengurusan.
 *
 * Fixture bersufiks, nol `TRUNCATE` — pola yang sama dengan
 * `tests/member-scope.test.ts` dan
 * `src/db/query/mass-credential-reset.test.ts`.
 */

const suffix = Date.now().toString(36)
const ACTOR_PASSWORD = 'password-pengurus-benar'

describe('regenerateMassCredentialsAction', () => {
  let pwId: string
  let pkTargetId: string
  let pkChildId: string
  let pkOutsideId: string
  let targetCode: string
  const orgIds: string[] = []
  const memberIds: string[] = []
  const userIds: string[] = []

  const insertOrg = async (values: {
    name: string
    type: 'pp' | 'pw' | 'pd' | 'pk'
    parentId: string | null
  }) => {
    const code = `${values.name.toUpperCase().replace(/\s+/g, '-')}-${suffix}`
    const [row] = await db
      .insert(organization)
      .values({
        name: values.name,
        slug: `${values.name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
        code,
        type: values.type,
        parentId: values.parentId,
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgIds.push(row.id)
    return { id: row.id, code }
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
        name: row.id,
        displayName: name,
        passwordHash: 'password-lama',
        role: 'member',
        connectedMemberId: row.id
      })
      .returning({ id: userTable.id })
    userIds.push(userRow.id)

    await db.insert(sessionTable).values({
      id: crypto.randomUUID(),
      secretHash: 'x',
      createdAt: new Date(),
      lastVerifiedAt: new Date(),
      userId: userRow.id
    })

    return { memberId: row.id, userId: userRow.id }
  }

  const addActor = async (
    role: 'bpk' | 'bph' | 'root',
    organizationId: string | null
  ) => {
    const passwordHash = await Bun.password.hash(ACTOR_PASSWORD)
    const [userRow] = await db
      .insert(userTable)
      .values({
        name: `actor-${role}-${crypto.randomUUID()}-${suffix}`,
        displayName: `Actor ${role} ${suffix}`,
        passwordHash,
        role,
        connectedOrganizationId: organizationId
      })
      .returning({ id: userTable.id, name: userTable.name })
    userIds.push(userRow.id)
    return userRow
  }

  const addOfficer = async (organizationId: string) => {
    const [userRow] = await db
      .insert(userTable)
      .values({
        name: `officer-${organizationId}-${suffix}`,
        displayName: `Officer ${suffix}`,
        passwordHash: 'password-pengurus-lama',
        role: 'bpk',
        connectedOrganizationId: organizationId
      })
      .returning({ id: userTable.id })
    userIds.push(userRow.id)
    return userRow.id
  }

  const sessionOf = (
    actor: { id: string; name: string },
    role: string,
    organizationId: string | null
  ) => ({
    user: {
      id: actor.id,
      name: actor.name,
      role,
      connectedOrganization: organizationId ? { id: organizationId } : null,
      connectedMember: null
    }
  })

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
    const pp = await insertOrg({
      name: `PP Regen Act ${suffix}`,
      type: 'pp',
      parentId: null
    })
    const pw = await insertOrg({
      name: `PW Regen Act ${suffix}`,
      type: 'pw',
      parentId: pp.id
    })
    pwId = pw.id
    const pkTarget = await insertOrg({
      name: `PK Target Act ${suffix}`,
      type: 'pk',
      parentId: pwId
    })
    pkTargetId = pkTarget.id
    targetCode = pkTarget.code
    const pkChild = await insertOrg({
      name: `PK Child Act ${suffix}`,
      type: 'pk',
      parentId: pkTargetId
    })
    pkChildId = pkChild.id
    const pkOutside = await insertOrg({
      name: `PK Outside Act ${suffix}`,
      type: 'pk',
      parentId: pwId
    })
    pkOutsideId = pkOutside.id
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

  it('menolak BPK dengan sasaran di luar Cakupannya', async () => {
    const actor = await addActor('bpk', pkOutsideId)
    mockSession = sessionOf(actor, 'bpk', pkOutsideId)

    const result = await regenerateMassCredentialsAction({
      organizationId: pkTargetId,
      confirmCode: targetCode,
      actorPassword: ACTOR_PASSWORD
    })

    expect(result.success).toBe(false)
  })

  it('menolak BPH sekalipun sasarannya di dalam Cakupannya', async () => {
    const actor = await addActor('bph', pwId)
    mockSession = sessionOf(actor, 'bph', pwId)

    const result = await regenerateMassCredentialsAction({
      organizationId: pkTargetId,
      confirmCode: targetCode,
      actorPassword: ACTOR_PASSWORD
    })

    expect(result.success).toBe(false)
  })

  it('menolak kode Struktur yang salah', async () => {
    const actor = await addActor('bpk', pkTargetId)
    mockSession = sessionOf(actor, 'bpk', pkTargetId)

    const result = await regenerateMassCredentialsAction({
      organizationId: pkTargetId,
      confirmCode: 'KODE-SALAH',
      actorPassword: ACTOR_PASSWORD
    })

    expect(result.success).toBe(false)
  })

  it('menolak password pengurus yang salah, dan tidak ada satu baris pun berubah', async () => {
    const actor = await addActor('bpk', pkTargetId)
    mockSession = sessionOf(actor, 'bpk', pkTargetId)
    const kader = await addKader('Kader Wrong Password', pkTargetId)
    const hashBefore = await passwordHashOf(kader.userId)
    const sessionsBefore = await sessionCountOf(kader.userId)

    const result = await regenerateMassCredentialsAction({
      organizationId: pkTargetId,
      confirmCode: targetCode,
      actorPassword: 'password-yang-salah'
    })

    expect(result.success).toBe(false)
    expect(await passwordHashOf(kader.userId)).toBe(hashBefore)
    expect(await sessionCountOf(kader.userId)).toBe(sessionsBefore)
  })

  it('berhasil: mengubah setiap password_hash di sasaran + turunan, menghapus setiap sesinya, dan tidak menyentuh Akun Kepengurusan', async () => {
    const actor = await addActor('bpk', pkTargetId)
    mockSession = sessionOf(actor, 'bpk', pkTargetId)

    const direct = await addKader('Kader Success Direct', pkTargetId)
    const nested = await addKader('Kader Success Nested', pkChildId)
    const officer = await addOfficer(pkTargetId)
    const officerHashBefore = await passwordHashOf(officer)

    const result = await regenerateMassCredentialsAction({
      organizationId: pkTargetId,
      confirmCode: targetCode,
      actorPassword: ACTOR_PASSWORD
    })

    expect(result.success).toBe(true)
    expect(result.rows?.length).toBeGreaterThanOrEqual(2)

    expect(await passwordHashOf(direct.userId)).not.toBe('password-lama')
    expect(await passwordHashOf(nested.userId)).not.toBe('password-lama')
    expect(await sessionCountOf(direct.userId)).toBe(0)
    expect(await sessionCountOf(nested.userId)).toBe(0)

    // Akun Kepengurusan sama sekali tidak tersentuh.
    expect(await passwordHashOf(officer)).toBe(officerHashBefore)
  })
})
