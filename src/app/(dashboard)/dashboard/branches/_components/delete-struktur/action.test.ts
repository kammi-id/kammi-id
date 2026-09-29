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
import { article } from '~/db/schema/article.sql'
import { training } from '~/db/schema/training.sql'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { deleteStrukturAction } = await import('./action')

/**
 * Tiket 22, spec §3, §1.3, §1.5. Prasyaratnya berbunyi lengkap — nol anak, nol
 * Member, nol Daurah — dan tiap klausanya diputus di tiket berbeda, jadi
 * ketiganya diuji apa adanya di sini alih-alih dipercaya sudah dirakit benar.
 *
 * Fixture bersufiks, nol `TRUNCATE` — alasannya sama dengan berkas
 * `deactivate-struktur` sebelahnya.
 */
describe('aksi hapus Struktur', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []
  const memberIds: string[] = []
  const trainingIds: string[] = []
  const articleIds: string[] = []

  let ppId: string
  let pwId: string
  let pdKosongId: string
  let pdBeranakId: string
  let pkBerkaderId: string
  let pkBerdaurahId: string
  let pkBerartikelId: string
  let pdAnakTerhapusId: string
  let anakTerhapusId: string
  let actorId: string

  const seed = async (
    name: string,
    code: string,
    type: 'pp' | 'pw' | 'pdln' | 'pd' | 'pk',
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
    orgIds.unshift(row.id)
    return row.id
  }

  const addTraining = async (organizationId: string, identifier: number) => {
    const [row] = await db
      .insert(training)
      .values({
        organizationId,
        name: `Daurah Penahan ${identifier} ${suffix}`,
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        type: 'dm1',
        identifier
      })
      .returning({ id: training.id })
    trainingIds.push(row.id)
  }

  const rowOf = async (id: string) => {
    const [row] = await db
      .select({
        state: organization.state,
        isNonActive: organization.isNonActive,
        deletedAt: organization.deletedAt,
        deletedBy: organization.deletedBy
      })
      .from(organization)
      .where(eq(organization.id, id))
    return row
  }

  const reset = async (
    id: string,
    values: { isNonActive?: boolean; deletedAt?: Date | null }
  ) => {
    await db
      .update(organization)
      .set({
        ...values,
        ...(values.deletedAt === null ? { deletedBy: null } : {})
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
    ppId = await seed('PP Hapus', `PP-H${suffix}`, 'pp', null)
    pwId = await seed('PW Hapus', 'PW8', 'pw', ppId)
    pdKosongId = await seed('PD Kosong Hapus', '98.PD-1', 'pd', pwId)
    pdBeranakId = await seed('PD Beranak Hapus', '98.PD-2', 'pd', pwId)
    pkBerkaderId = await seed('PK Berkader', '98.PD-2.KDR', 'pk', pdBeranakId)
    pkBerdaurahId = await seed('PK Berdaurah', '98.PD-1.DRH', 'pk', pdKosongId)
    pkBerartikelId = await seed(
      'PK Berartikel',
      '98.PD-1.ART',
      'pk',
      pdKosongId
    )
    pdAnakTerhapusId = await seed('PD Anak Terhapus', '98.PD-3', 'pd', pwId)
    anakTerhapusId = await seed(
      'PK Sudah Terhapus',
      '98.PD-3.THP',
      'pk',
      pdAnakTerhapusId
    )

    const [actor] = await db
      .insert(userTable)
      .values({
        name: `pelaku-hapus-${suffix}`,
        displayName: `Pelaku Hapus ${suffix}`,
        passwordHash: 'x',
        role: 'root'
      })
      .returning({ id: userTable.id })
    actorId = actor.id

    const [kader] = await db
      .insert(member)
      .values({
        name: `Kader Penahan ${suffix}`,
        organizationId: pkBerkaderId,
        registerNumber: `KDRPENAHAN${suffix}`,
        status: 'ab1',
        gender: 'ikhwan',
        yearOfEntry: 2024,
        isAlumn: false,
        isSuspended: false,
        isNonActive: false
      })
      .returning({ id: member.id })
    memberIds.push(kader.id)

    await addTraining(pkBerdaurahId, 1)

    // Publikasi menggantung — sengaja BUKAN prasyarat (spec §3 klausa 3).
    const [row] = await db
      .insert(article)
      .values({
        organizationId: pkBerartikelId,
        type: 'blog',
        title: `Artikel Menggantung ${suffix}`,
        slug: `artikel-menggantung-${suffix}`,
        body: {}
      })
      .returning({ id: article.id })
    articleIds.push(row.id)
  })

  afterAll(async () => {
    if (articleIds.length)
      await db.delete(article).where(inArray(article.id, articleIds))
    if (trainingIds.length)
      await db.delete(training).where(inArray(training.id, trainingIds))
    if (memberIds.length)
      await db.delete(member).where(inArray(member.id, memberIds))
    // Struktur sebelum pelakunya: `deleted_by` NO ACTION (tiket 13), jadi Akun
    // yang pernah menghapus sebuah Struktur tidak bisa pergi lebih dulu.
    await db.delete(organization).where(inArray(organization.id, orgIds))
    await db.delete(userTable).where(eq(userTable.id, actorId))
  })

  beforeEach(async () => {
    mockSession = sessionOf('root', null)
    for (const id of orgIds) {
      await reset(id, { deletedAt: null, isNonActive: false })
    }
    await reset(anakTerhapusId, { deletedAt: new Date() })
  })

  it('menolak Struktur yang masih punya Kader hidup — Root juga', async () => {
    const result = await deleteStrukturAction(pkBerkaderId, '98.PD-2.KDR')

    expect(result.success).toBe(false)
    expect(result.counts?.members).toBe(1)
    expect(result.message).toContain('1 Kader')
    expect((await rowOf(pkBerkaderId))?.state).toBe('aktif')
  })

  it('menolak Struktur yang masih punya Daurah', async () => {
    const result = await deleteStrukturAction(pkBerdaurahId, '98.PD-1.DRH')

    expect(result.success).toBe(false)
    expect(result.counts?.trainings).toBe(1)
    expect(result.message).toContain('1 Daurah')
  })

  it('menolak induk yang anaknya Non-Aktif — anak Non-Aktif menghitung', async () => {
    await reset(pkBerkaderId, { isNonActive: true })

    const result = await deleteStrukturAction(pdBeranakId, '98.PD-2')

    expect(result.success).toBe(false)
    expect(result.counts?.children).toBe(1)
    expect(result.message).toContain('1 Komisariat')
  })

  it('berhasil saat anaknya cuma Terhapus — anak Terhapus tidak menghitung', async () => {
    const result = await deleteStrukturAction(pdAnakTerhapusId, '98.PD-3')

    expect(result.success).toBe(true)
    expect((await rowOf(pdAnakTerhapusId))?.state).toBe('terhapus')
  })

  it('berhasil meski Artikelnya menggantung — Publikasi bukan prasyarat', async () => {
    const result = await deleteStrukturAction(pkBerartikelId, '98.PD-1.ART')

    expect(result.success).toBe(true)
    expect((await rowOf(pkBerartikelId))?.state).toBe('terhapus')
  })

  it('menghapus Struktur Non-Aktif langsung, tanpa mengharuskannya diaktifkan dulu', async () => {
    await reset(pdKosongId, { isNonActive: true })
    await reset(pkBerdaurahId, { deletedAt: new Date() })
    await reset(pkBerartikelId, { deletedAt: new Date() })

    const result = await deleteStrukturAction(pdKosongId, '98.PD-1')

    expect(result.success).toBe(true)
    expect((await rowOf(pdKosongId))?.state).toBe('terhapus')
  })

  it('tidak menyapu is_non_active saat menghapus — mendominasi bukan menghapus', async () => {
    await reset(pkBerartikelId, { isNonActive: true })

    await deleteStrukturAction(pkBerartikelId, '98.PD-1.ART')

    const row = await rowOf(pkBerartikelId)
    expect(row?.state).toBe('terhapus')
    expect(row?.isNonActive).toBe(true)
  })

  it('mengisi jejak deleted_at dan deleted_by', async () => {
    await deleteStrukturAction(pkBerartikelId, '98.PD-1.ART')

    const row = await rowOf(pkBerartikelId)
    expect(row?.deletedAt).toBeInstanceOf(Date)
    expect(row?.deletedBy).toBe(actorId)
  })

  it('merangkai lebih dari satu prasyarat jadi satu kalimat', async () => {
    await addTraining(pkBerkaderId, 2)

    const result = await deleteStrukturAction(pkBerkaderId, '98.PD-2.KDR')

    expect(result.message).toBe(
      'Tidak bisa dihapus: masih ada 1 Kader dan 1 Daurah.'
    )
  })

  it('menolak kode konfirmasi yang tidak sesuai', async () => {
    const result = await deleteStrukturAction(pkBerartikelId, 'SALAH')

    expect(result.success).toBe(false)
    expect((await rowOf(pkBerartikelId))?.state).toBe('aktif')
  })

  it('menolak Kewenangan yang tidak memegang sel hapus', async () => {
    mockSession = sessionOf('bpw', pwId)

    const result = await deleteStrukturAction(pkBerartikelId, '98.PD-1.ART')

    expect(result.success).toBe(false)
    expect((await rowOf(pkBerartikelId))?.state).toBe('aktif')
  })

  it('menolak tanpa sesi', async () => {
    mockSession = undefined

    const result = await deleteStrukturAction(pkBerartikelId, '98.PD-1.ART')

    expect(result.success).toBe(false)
  })

  it('tidak pernah mengeluarkan barisnya dari tabel', async () => {
    await deleteStrukturAction(pkBerartikelId, '98.PD-1.ART')

    const [row] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.id, pkBerartikelId))

    expect(row).toBeDefined()
  })
})
