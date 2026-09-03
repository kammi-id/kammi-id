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

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { readRestoreInfoAction, restoreStrukturAction } =
  await import('./action')

/**
 * Tiket 28, spec §8.4 dan §1.5. Fixture bersufiks, dibereskan sendiri, tanpa
 * `TRUNCATE` — mengikuti `struktur-keadaan/action.test.ts`.
 *
 * Yang paling gampang salah di seluruh fitur ini ada di berkas ini: gate
 * `pulihkan` bukan `role === 'bpw'`. Jadi yang dibuktikan bukan cuma bahwa
 * BPW PP lolos, tapi bahwa **BPW PD dan BPW PDLN ditolak**.
 */
describe('pemulihan Struktur Terhapus', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []

  let ppId: string
  let pwId: string
  let pdId: string
  let pkId: string
  let penyaingId: string
  let actorId: string

  const seed = async (
    name: string,
    code: string,
    type: 'pp' | 'pw' | 'pdln' | 'pd' | 'pk',
    parentId: string | null,
    slug?: string
  ) => {
    const [row] = await db
      .insert(organization)
      .values({
        name: `${name} ${suffix}`,
        slug: slug ?? `${name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
        code,
        type,
        parentId,
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgIds.unshift(row.id)
    return row.id
  }

  const rowOf = async (id: string) => {
    const [row] = await db
      .select({
        slug: organization.slug,
        state: organization.state,
        isNonActive: organization.isNonActive,
        nonActiveAt: organization.nonActiveAt,
        deletedAt: organization.deletedAt,
        deletedBy: organization.deletedBy
      })
      .from(organization)
      .where(eq(organization.id, id))
    return row
  }

  const setState = async (
    id: string,
    values: { deleted?: boolean; nonActive?: boolean }
  ) => {
    await db
      .update(organization)
      .set({
        deletedAt: values.deleted ? new Date() : null,
        deletedBy: values.deleted ? actorId : null,
        isNonActive: values.nonActive ?? false,
        nonActiveAt: values.nonActive ? new Date() : null,
        nonActiveBy: null
      })
      .where(eq(organization.id, id))
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
        name: `pelaku-pulihkan-${suffix}`,
        displayName: `Pelaku Pulihkan ${suffix}`,
        passwordHash: 'x',
        role: 'root'
      })
      .returning({ id: userTable.id })
    actorId = actor.id

    ppId = await seed('PP Pulihkan', `PP-P-${suffix}`, 'pp', null)
    pwId = await seed('PW Pulihkan', `PW8`, 'pw', ppId)
    pdId = await seed('PD Pulihkan', `98.PD-1`, 'pd', pwId)
    pkId = await seed('PK Pulihkan', `98.PD-1.PLH`, 'pk', pdId)
    penyaingId = await seed(
      'PK Penyaing',
      `98.PD-1.PNY`,
      'pk',
      pdId,
      `penyaing-${suffix}`
    )
  })

  afterAll(async () => {
    await db.delete(organization).where(inArray(organization.id, orgIds))
    await db.delete(userTable).where(eq(userTable.id, actorId))
  })

  beforeEach(async () => {
    mockSession = sessionOf('root', ppId)
    // Slug dibereskan LEBIH DULU, baru Keadaan. Urutan sebaliknya membangkitkan
    // baris Terhapus yang masih memegang slug rebutan dari tes sebelumnya, dan
    // partial unique index `organization_slug_live_unique` menolaknya dengan
    // 23505 — di dalam `beforeEach`, jadi tes yang gugur bukan tes yang salah.
    await db
      .update(organization)
      .set({ slug: `penyaing-${suffix}` })
      .where(eq(organization.id, penyaingId))
    await db
      .update(organization)
      .set({ slug: `pk-pulihkan-${suffix}` })
      .where(eq(organization.id, pkId))
    for (const id of orgIds) await setState(id, {})
  })

  describe('gate — yang paling gampang salah', () => {
    it('meloloskan BPW yang Struktur terhubungnya PP', async () => {
      await setState(pkId, { deleted: true })
      mockSession = sessionOf('bpw', ppId)

      const result = await restoreStrukturAction(pkId)

      expect(result.success).toBe(true)
    })

    it('menolak BPW PD — menyalin pola `role === bpw` akan membuka pemulihan untuk seluruh BPW', async () => {
      await setState(pkId, { deleted: true })
      mockSession = sessionOf('bpw', pdId)

      const result = await restoreStrukturAction(pkId)

      expect(result.success).toBe(false)
      expect((await rowOf(pkId))?.state).toBe('terhapus')
      expect(await readRestoreInfoAction(pkId)).toBeNull()
    })

    it('menolak BPW PW — BPD tidak memegang `pulihkan` sama sekali', async () => {
      await setState(pkId, { deleted: true })
      mockSession = sessionOf('bpw', pwId)

      expect((await restoreStrukturAction(pkId)).success).toBe(false)
      expect((await rowOf(pkId))?.state).toBe('terhapus')
    })

    it('menolak BPH dan BPK', async () => {
      await setState(pkId, { deleted: true })
      for (const role of ['bph', 'bpk', 'humas']) {
        mockSession = sessionOf(role, ppId)
        expect((await restoreStrukturAction(pkId)).success).toBe(false)
      }
      expect((await rowOf(pkId))?.state).toBe('terhapus')
    })
  })

  describe('pemulihan', () => {
    it('mengosongkan dua kolom sekaligus — yang Non-Aktif lalu dihapus kembali sebagai Aktif', async () => {
      await setState(pkId, { deleted: true, nonActive: true })

      const result = await restoreStrukturAction(pkId)

      expect(result.success).toBe(true)
      const row = await rowOf(pkId)
      expect(row?.state).toBe('aktif')
      expect(row?.deletedAt).toBeNull()
      expect(row?.deletedBy).toBeNull()
      expect(row?.isNonActive).toBe(false)
      expect(row?.nonActiveAt).toBeNull()
    })

    it('tidak memulihkan keturunannya sekaligus', async () => {
      await setState(pdId, { deleted: true })
      await setState(pkId, { deleted: true })

      await restoreStrukturAction(pdId)

      expect((await rowOf(pdId))?.state).toBe('aktif')
      expect((await rowOf(pkId))?.state).toBe('terhapus')
    })
  })

  describe('induk yang tidak hidup', () => {
    it('menolak saat induknya Non-Aktif, dan menyebut jalan keluarnya', async () => {
      await setState(pdId, { nonActive: true })
      await setState(pkId, { deleted: true })

      const result = await restoreStrukturAction(pkId)

      expect(result.success).toBe(false)
      expect(result.message).toMatch(/aktifkan induknya|pindahkan/i)
      expect((await rowOf(pkId))?.state).toBe('terhapus')
    })

    it('menyebut nama induk yang juga Terhapus dan menyerahkan id barisnya', async () => {
      await setState(pdId, { deleted: true })
      await setState(pkId, { deleted: true })

      const info = await readRestoreInfoAction(pkId)

      expect(info?.refusal).toContain(`PD Pulihkan ${suffix}`)
      expect(info?.refusalParentId).toBe(pdId)
    })
  })

  describe('tabrakan slug', () => {
    it('menamai pemilik slug yang sekarang dan menyodorkan usulan yang bebas', async () => {
      const slug = `rebutan-${suffix}`
      await db
        .update(organization)
        .set({ slug })
        .where(eq(organization.id, pkId))
      await setState(pkId, { deleted: true })
      await db
        .update(organization)
        .set({ slug })
        .where(eq(organization.id, penyaingId))

      const info = await readRestoreInfoAction(pkId)

      expect(info?.slugTakenBy).toBe(`PK Penyaing ${suffix}`)
      expect(info?.suggestedSlug).not.toBe(slug)
    })

    it('menolak pemulihan yang tetap memakai slug yang sudah dipungut, dengan galat untuk field slug', async () => {
      const slug = `rebutan2-${suffix}`
      await db
        .update(organization)
        .set({ slug })
        .where(eq(organization.id, pkId))
      await setState(pkId, { deleted: true })
      await db
        .update(organization)
        .set({ slug })
        .where(eq(organization.id, penyaingId))

      const result = await restoreStrukturAction(pkId, slug)

      expect(result.success).toBe(false)
      expect(result.slugError).toContain(`PK Penyaing ${suffix}`)
      expect(result.message).toBeUndefined()
      expect((await rowOf(pkId))?.state).toBe('terhapus')
    })

    it('memulihkan dengan slug baru yang dipilih orangnya', async () => {
      const slug = `rebutan3-${suffix}`
      await db
        .update(organization)
        .set({ slug })
        .where(eq(organization.id, pkId))
      await setState(pkId, { deleted: true })
      await db
        .update(organization)
        .set({ slug })
        .where(eq(organization.id, penyaingId))

      const result = await restoreStrukturAction(pkId, `${slug}-2`)

      expect(result.success).toBe(true)
      const row = await rowOf(pkId)
      expect(row?.slug).toBe(`${slug}-2`)
      expect(row?.state).toBe('aktif')
    })
  })
})
