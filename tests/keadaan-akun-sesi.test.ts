import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { member } from '~/db/schema/member.sql'
import { user as userTable } from '~/db/schema/user.sql'
import { session as sessionTable } from '~/db/schema/session.sql'
import { createSession, validateSession } from '~/lib/auth/api'

/**
 * Tiket 19 / spec §5. Yang diuji di sini bukan derivasinya — itu tabel murni di
 * `src/lib/auth/keadaan-akun.test.ts` — melainkan **bahwa seam-nya benar-benar
 * terpasang di `validateSession`**, sehingga sesi yang sudah ada di tangan
 * berhenti berlaku di request berikutnya tanpa satu pun call-site diubah.
 *
 * Sesinya sengaja dibuat **saat Struktur masih Aktif**, lalu Strukturnya
 * dimatikan. Itu persis bentuk kejadiannya: penonaktifan terjadi di tengah
 * `maxAge` tiga hari, bukan sebelum orangnya login.
 */

const suffix = Date.now().toString(36)

describe('Keadaan Akun di seam sesi', () => {
  let orgId: string
  const userIds: string[] = []
  const memberIds: string[] = []

  const tokenOf = async (userId: string) => {
    const created = await createSession(userId)
    return created!.token
  }

  const setState = async (state: 'aktif' | 'non_aktif' | 'terhapus') => {
    await db
      .update(organization)
      .set({
        isNonActive: state === 'non_aktif',
        nonActiveAt: state === 'non_aktif' ? new Date() : null,
        deletedAt: state === 'terhapus' ? new Date() : null
      })
      .where(eq(organization.id, orgId))
  }

  const addUser = async (
    role: 'bph' | 'bpk' | 'bpw' | 'humas' | 'root' | 'member',
    connected: { organizationId?: string; memberId?: string }
  ) => {
    const [row] = await db
      .insert(userTable)
      .values({
        name: `${role}-sesi-${suffix}`,
        displayName: `${role.toUpperCase()} Sesi ${suffix}`,
        passwordHash: 'x',
        role,
        connectedOrganizationId: connected.organizationId ?? null,
        connectedMemberId: connected.memberId ?? null
      })
      .returning({ id: userTable.id })
    userIds.push(row.id)
    return row.id
  }

  let bphId: string
  let rootId: string
  let kaderAkunId: string

  beforeAll(async () => {
    const [org] = await db
      .insert(organization)
      .values({
        name: `PD Sesi ${suffix}`,
        slug: `pd-sesi-${suffix}`,
        code: `PD-SESI-${suffix}`,
        type: 'pd',
        parentId: null,
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgId = org.id

    const [kader] = await db
      .insert(member)
      .values({
        name: `Kader Sesi ${suffix}`,
        organizationId: orgId,
        registerNumber: `KADERSESI${suffix}`,
        status: 'ab1',
        gender: 'ikhwan',
        yearOfEntry: 2024,
        isAlumn: false,
        isSuspended: false,
        isNonActive: false
      })
      .returning({ id: member.id })
    memberIds.push(kader.id)

    bphId = await addUser('bph', { organizationId: orgId })
    rootId = await addUser('root', { organizationId: orgId })
    kaderAkunId = await addUser('member', { memberId: kader.id })
  })

  afterAll(async () => {
    if (userIds.length)
      await db.delete(sessionTable).where(inArray(sessionTable.userId, userIds))
    if (userIds.length)
      await db.delete(userTable).where(inArray(userTable.id, userIds))
    if (memberIds.length)
      await db.delete(member).where(inArray(member.id, memberIds))
    await db.delete(organization).where(eq(organization.id, orgId))
  })

  it('meloloskan Akun kepengurusan selama Strukturnya Aktif', async () => {
    await setState('aktif')
    const token = await tokenOf(bphId)

    expect(await validateSession(token)).toBeDefined()
  })

  it('menutup sesi yang sudah di tangan begitu Strukturnya dinonaktifkan', async () => {
    await setState('aktif')
    const token = await tokenOf(bphId)
    expect(await validateSession(token)).toBeDefined()

    await setState('non_aktif')

    expect(await validateSession(token)).toBeUndefined()
  })

  it('menutup sesi yang sudah di tangan begitu Strukturnya dihapus', async () => {
    await setState('aktif')
    const token = await tokenOf(bphId)

    await setState('terhapus')

    expect(await validateSession(token)).toBeUndefined()
  })

  it('membuka lagi begitu Strukturnya diaktifkan kembali — tanpa login ulang', async () => {
    await setState('aktif')
    const token = await tokenOf(bphId)
    await setState('non_aktif')
    expect(await validateSession(token)).toBeUndefined()

    await setState('aktif')

    expect(await validateSession(token)).toBeDefined()
  })

  it('membiarkan Akun Kader masuk meski Strukturnya Non-Aktif', async () => {
    await setState('non_aktif')
    const token = await tokenOf(kaderAkunId)

    expect(await validateSession(token)).toBeDefined()
  })

  it('membiarkan Root masuk meski Strukturnya mati', async () => {
    await setState('terhapus')
    const token = await tokenOf(rootId)

    expect(await validateSession(token)).toBeDefined()
  })

  it('tidak menambah satu pun kolom Keadaan di user', async () => {
    const rows = (await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user'
    `)) as unknown as { column_name: string }[]
    const columns = rows.map((r) => r.column_name)

    expect(columns).toEqual(
      expect.arrayContaining([
        'id',
        'name',
        'role',
        'connected_organization_id',
        'connected_member_id'
      ])
    )
    expect(
      columns.filter(
        (c) =>
          c.includes('state') ||
          c.includes('non_active') ||
          c.includes('deleted')
      )
    ).toEqual([])
  })
})
