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

const { hardDeleteStrukturAction, readHardDeleteRefusal } =
  await import('./action')
const { confirmationSentenceFor } = await import('./schema')

/**
 * ADR 0019. Bukan pengulangan `delete-struktur/action.test.ts` — gerbangnya
 * sengaja lebih ketat di titik yang berlawanan: `checkDeletion` sudah
 * membuktikan anak Terhapus dan Kader hidup-saja tidak menahan Hapus biasa;
 * di sini keduanya justru **wajib** menahan, sebab barisnya sungguhan lenyap.
 *
 * Fixture bersufiks. Baris yang benar-benar berhasil dihapus selamanya dibuat
 * sendiri di dalam `it`-nya masing-masing, bukan di `beforeAll` — begitu
 * berhasil, barisnya sungguhan tiada, jadi tidak ada yang perlu direset atau
 * dibereskan `afterAll` untuknya.
 */
describe('aksi Hapus Selamanya', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []
  const memberIds: string[] = []
  const trainingIds: string[] = []
  const articleIds: string[] = []

  let ppId: string
  let pwId: string
  let pdKosongTerhapusId: string
  let pkBerkaderSoftDeletedId: string
  let pdBeranakTerhapusId: string
  let pkBerdaurahId: string
  let pkBerartikelId: string
  let actorId: string

  const seed = async (
    name: string,
    code: string,
    type: 'pp' | 'pw' | 'pdln' | 'pd' | 'pk',
    parentId: string | null,
    deleted = true
  ) => {
    const [row] = await db
      .insert(organization)
      .values({
        name: `${name} ${suffix}`,
        slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
        code,
        type,
        parentId,
        isNonActive: false,
        deletedAt: deleted ? new Date() : null,
        deletedBy: deleted ? actorId : null
      })
      .returning({ id: organization.id })
    orgIds.unshift(row.id)
    return row.id
  }

  const rowExists = async (id: string) => {
    const [row] = await db
      .select({ id: organization.id })
      .from(organization)
      .where(eq(organization.id, id))
    return row !== undefined
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
        name: `pelaku-hapus-selamanya-${suffix}`,
        displayName: `Pelaku Hapus Selamanya ${suffix}`,
        passwordHash: 'x',
        role: 'root'
      })
      .returning({ id: userTable.id })
    actorId = actor.id

    ppId = await seed('PP Selamanya', `PP-S${suffix}`, 'pp', null, false)
    pwId = await seed('PW Selamanya', 'PWS7', 'pw', ppId, false)
    pdKosongTerhapusId = await seed(
      'PD Kosong Selamanya',
      '97.PD-1',
      'pd',
      pwId
    )
    pkBerkaderSoftDeletedId = await seed(
      'PK Kader Lama',
      '97.PD-1.KDR',
      'pk',
      pdKosongTerhapusId
    )
    pdBeranakTerhapusId = await seed(
      'PD Beranak Selamanya',
      '97.PD-2',
      'pd',
      pwId
    )
    // Baris ini sendiri tidak pernah dirujuk lagi — cukup ada, supaya
    // `pdBeranakTerhapusId` sungguhan punya anak Terhapus.
    await seed('PK Anak Terhapus', '97.PD-2.ANK', 'pk', pdBeranakTerhapusId)
    pkBerdaurahId = await seed(
      'PK Berdaurah',
      '97.PD-1.DRH',
      'pk',
      pdKosongTerhapusId
    )
    pkBerartikelId = await seed(
      'PK Berartikel',
      '97.PD-1.ART',
      'pk',
      pdKosongTerhapusId
    )

    // Kader ini sudah lama di-soft-delete — persis lubang ADR 0004 menolak
    // hard delete Struktur "kosong": nol Member HIDUP tidak berarti Struktur
    // ini tidak pernah punya Member sama sekali.
    const [kader] = await db
      .insert(member)
      .values({
        name: `Kader Lama ${suffix}`,
        organizationId: pkBerkaderSoftDeletedId,
        registerNumber: `KDRLAMA${suffix}`,
        status: 'ab1',
        gender: 'ikhwan',
        yearOfEntry: 2020,
        isAlumn: false,
        isSuspended: false,
        isNonActive: false,
        deletedAt: new Date()
      })
      .returning({ id: member.id })
    memberIds.push(kader.id)

    const [trainingRow] = await db
      .insert(training)
      .values({
        organizationId: pkBerdaurahId,
        name: `Daurah Penahan Selamanya ${suffix}`,
        startDate: '2025-01-01',
        endDate: '2025-01-03',
        type: 'dm1',
        identifier: 1
      })
      .returning({ id: training.id })
    trainingIds.push(trainingRow.id)

    const [articleRow] = await db
      .insert(article)
      .values({
        organizationId: pkBerartikelId,
        type: 'blog',
        title: `Artikel Menggantung Selamanya ${suffix}`,
        slug: `artikel-menggantung-selamanya-${suffix}`,
        body: {}
      })
      .returning({ id: article.id })
    articleIds.push(articleRow.id)
  })

  afterAll(async () => {
    if (articleIds.length)
      await db.delete(article).where(inArray(article.id, articleIds))
    if (trainingIds.length)
      await db.delete(training).where(inArray(training.id, trainingIds))
    if (memberIds.length)
      await db.delete(member).where(inArray(member.id, memberIds))
    await db.delete(organization).where(inArray(organization.id, orgIds))
    await db.delete(userTable).where(eq(userTable.id, actorId))
  })

  beforeEach(() => {
    mockSession = sessionOf('root', null)
  })

  describe('checkHardDeletion diterapkan sungguhan', () => {
    it('menolak Kader yang sudah di-soft-delete — lubang yang ditutup ADR 0019', async () => {
      const refusal = await readHardDeleteRefusal({
        id: pkBerkaderSoftDeletedId,
        type: 'pk'
      })

      expect(refusal?.counts.membersEver).toBe(1)
      expect(refusal?.message).toContain(
        '1 Kader (termasuk yang sudah dihapus)'
      )
    })

    it('menolak induk selama anaknya Terhapus — beda dari checkDeletion', async () => {
      const result = await hardDeleteStrukturAction(
        pdBeranakTerhapusId,
        '97.PD-2',
        confirmationSentenceFor(`PD Beranak Selamanya ${suffix}`)
      )

      expect(result.success).toBe(false)
      expect(result.counts?.children).toBe(1)
      expect(result.message).toContain('1 Komisariat')
      expect(await rowExists(pdBeranakTerhapusId)).toBe(true)
    })

    it('menolak selama masih ada Daurah', async () => {
      const result = await hardDeleteStrukturAction(
        pkBerdaurahId,
        '97.PD-1.DRH',
        confirmationSentenceFor(`PK Berdaurah ${suffix}`)
      )

      expect(result.success).toBe(false)
      expect(result.counts?.trainings).toBe(1)
    })

    it('menolak selama Artikel menggantung — beda dari checkDeletion, yang membiarkannya', async () => {
      const result = await hardDeleteStrukturAction(
        pkBerartikelId,
        '97.PD-1.ART',
        confirmationSentenceFor(`PK Berartikel ${suffix}`)
      )

      expect(result.success).toBe(false)
      expect(result.counts?.publikasi).toBeGreaterThan(0)
      expect(await rowExists(pkBerartikelId)).toBe(true)
    })
  })

  describe('gate — sama persis dengan pulihkan', () => {
    it('menolak BPW yang bukan terhubung ke PP', async () => {
      mockSession = sessionOf('bpw', pwId)

      const result = await hardDeleteStrukturAction(
        pdKosongTerhapusId,
        '97.PD-1',
        confirmationSentenceFor(`PD Kosong Selamanya ${suffix}`)
      )

      expect(result.success).toBe(false)
      expect(await rowExists(pdKosongTerhapusId)).toBe(true)
    })

    it('menolak BPH, BPK, dan Humas', async () => {
      for (const role of ['bph', 'bpk', 'humas']) {
        mockSession = sessionOf(role, ppId)
        const result = await hardDeleteStrukturAction(
          pdKosongTerhapusId,
          '97.PD-1',
          confirmationSentenceFor(`PD Kosong Selamanya ${suffix}`)
        )
        expect(result.success).toBe(false)
      }
      expect(await rowExists(pdKosongTerhapusId)).toBe(true)
    })

    it('menolak tanpa sesi', async () => {
      mockSession = undefined

      const result = await hardDeleteStrukturAction(
        pdKosongTerhapusId,
        '97.PD-1',
        confirmationSentenceFor(`PD Kosong Selamanya ${suffix}`)
      )

      expect(result.success).toBe(false)
      expect(await rowExists(pdKosongTerhapusId)).toBe(true)
    })
  })

  it('menolak kode konfirmasi yang tidak sesuai', async () => {
    const result = await hardDeleteStrukturAction(
      pdKosongTerhapusId,
      'SALAH',
      confirmationSentenceFor(`PD Kosong Selamanya ${suffix}`)
    )

    expect(result.success).toBe(false)
    expect(await rowExists(pdKosongTerhapusId)).toBe(true)
  })

  it('menolak kalimat konfirmasi yang tidak sesuai, meski kodenya benar', async () => {
    const result = await hardDeleteStrukturAction(
      pdKosongTerhapusId,
      '97.PD-1',
      'Saya ingin menghapus Struktur yang salah'
    )

    expect(result.success).toBe(false)
    expect(result.message).toBe(
      'Kalimat konfirmasi yang dimasukkan tidak sesuai.'
    )
    expect(await rowExists(pdKosongTerhapusId)).toBe(true)
  })

  it('menolak Struktur yang belum Terhapus sama sekali', async () => {
    const result = await hardDeleteStrukturAction(
      pwId,
      'PWS7',
      confirmationSentenceFor(`PW Selamanya ${suffix}`)
    )

    expect(result.success).toBe(false)
    expect(result.message).toBe('Struktur tidak ditemukan.')
  })

  it('berhasil menghapus Struktur yang benar-benar tidak pernah dipakai, dan barisnya sungguhan lenyap', async () => {
    const code = `97.PD-KOSONG.${suffix}`
    const name = `PK Benar Kosong ${suffix}`
    const [org] = await db
      .insert(organization)
      .values({
        name,
        slug: `pk-benar-kosong-${suffix}`,
        code,
        type: 'pk',
        parentId: pdKosongTerhapusId,
        isNonActive: false,
        deletedAt: new Date(),
        deletedBy: actorId
      })
      .returning({ id: organization.id })

    const [akun1, akun2] = await db
      .insert(userTable)
      .values([
        {
          name: `bph-benar-kosong-${suffix}`,
          displayName: `BPH PK Benar Kosong ${suffix}`,
          passwordHash: 'x',
          role: 'bph',
          connectedOrganizationId: org.id
        },
        {
          name: `humas-benar-kosong-${suffix}`,
          displayName: `Humas PK Benar Kosong ${suffix}`,
          passwordHash: 'x',
          role: 'humas',
          connectedOrganizationId: org.id
        }
      ])
      .returning({ id: userTable.id })

    const result = await hardDeleteStrukturAction(
      org.id,
      code,
      confirmationSentenceFor(name)
    )

    expect(result.success).toBe(true)
    expect(await rowExists(org.id)).toBe(false)

    const remainingAccounts = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(inArray(userTable.id, [akun1.id, akun2.id]))
    expect(remainingAccounts).toHaveLength(0)
  })
})
