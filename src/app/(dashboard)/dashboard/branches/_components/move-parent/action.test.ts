import { describe, it, expect, beforeAll, beforeEach, mock } from 'bun:test'
import { db } from '~/db/db'
import { eq, sql } from 'drizzle-orm'
import { organization } from '~/db/schema/organization.sql'
import { member } from '~/db/schema/member.sql'
import { createOrganization } from '~/db/query/organization'
import { createMember } from '~/db/query/member'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { moveStrukturParentAction, moveActiveChildrenToParentAction } =
  await import('./action')

const sessionWith = (role: string, organizationId: string | null) => ({
  user: {
    id: 'u1',
    role,
    connectedOrganization: organizationId ? { id: organizationId } : null,
    connectedMember: null
  }
})

const seed = async (
  name: string,
  slug: string,
  code: string,
  type: 'pp' | 'pw' | 'pdln' | 'pd' | 'pk',
  parentId: string | null
) => {
  const [org] = await createOrganization({
    name,
    slug,
    code,
    type,
    parentId,
    isNonActive: false
  })
  return org.id
}

const parentOf = async (id: string) => {
  const [row] = await db
    .select({ parentId: organization.parentId })
    .from(organization)
    .where(eq(organization.id, id))
  return row?.parentId ?? null
}

describe('aksi pindah induk', () => {
  let ppId: string
  let pwJabarId: string
  let pwJatimId: string
  let pdBandungId: string
  let pdBogorId: string
  let pdSurabayaId: string
  let pdlnMesirId: string
  let pdlnTurkiId: string
  let pkItbId: string
  let pkUnpadId: string
  let pkPasundanId: string
  let pkKairoId: string
  let memberId: string

  /** The shape the tree is restored to before every test. */
  let asalUsul: Record<string, string | null>

  // Seeded once: `createOrganization` hashes a password per Akun it mints, and
  // paying that for eleven Struktur on every test buys nothing. What the tests
  // actually mutate is one column, so `beforeEach` puts that column back.
  //
  // Twelve sequential password hashes plus a CASCADE truncate routinely clear
  // 5s on a throttled CI runner — bumped past bun test's default hook timeout.
  beforeAll(async () => {
    await db.execute(sql`TRUNCATE TABLE "user", "member", organization CASCADE`)

    ppId = await seed('PP KAMMI', 'pp-kammi', 'PP-00', 'pp', null)
    pwJabarId = await seed('PW Jabar', 'pw-jabar', 'PW1', 'pw', ppId)
    pwJatimId = await seed('PW Jatim', 'pw-jatim', 'PW2', 'pw', ppId)
    pdBandungId = await seed(
      'PD Bandung',
      'pd-bandung',
      '01.PD-1',
      'pd',
      pwJabarId
    )
    pdBogorId = await seed('PD Bogor', 'pd-bogor', '01.PD-2', 'pd', pwJabarId)
    pdSurabayaId = await seed(
      'PD Surabaya',
      'pd-surabaya',
      '02.PD-1',
      'pd',
      pwJatimId
    )
    pdlnMesirId = await seed(
      'PDLN Mesir',
      'pdln-mesir',
      'PD.LN-8',
      'pdln',
      ppId
    )
    pdlnTurkiId = await seed(
      'PDLN Turki',
      'pdln-turki',
      'PD.LN-9',
      'pdln',
      ppId
    )
    pkItbId = await seed('PK ITB', 'pk-itb', '01.PD-1.ITB', 'pk', pdBandungId)
    pkUnpadId = await seed(
      'PK Unpad',
      'pk-unpad',
      '01.PD-1.UNPAD',
      'pk',
      pdBandungId
    )
    pkPasundanId = await seed(
      'PK Pasundan',
      'pk-pasundan',
      '01.PD-1.PAS',
      'pk',
      pdBandungId
    )
    pkKairoId = await seed('PK Kairo', 'pk-kairo', 'PK.LN-1', 'pk', pdlnMesirId)

    const [kader] = await createMember({
      name: 'Kader ITB',
      registerNumber: '01012024001',
      organizationId: pkItbId,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2024
    })
    memberId = kader.id

    asalUsul = {
      [pwJabarId]: ppId,
      [pwJatimId]: ppId,
      [pdBandungId]: pwJabarId,
      [pdBogorId]: pwJabarId,
      [pdSurabayaId]: pwJatimId,
      [pdlnMesirId]: ppId,
      [pdlnTurkiId]: ppId,
      [pkItbId]: pdBandungId,
      [pkUnpadId]: pdBandungId,
      [pkPasundanId]: pdBandungId,
      [pkKairoId]: pdlnMesirId
    }
  }, 15000)

  beforeEach(async () => {
    mockSession = sessionWith('root', ppId)
    for (const [id, parentId] of Object.entries(asalUsul)) {
      await db
        .update(organization)
        .set({ parentId, isNonActive: false })
        .where(eq(organization.id, id))
    }
  })

  describe('moveStrukturParentAction', () => {
    it('memindahkan PK ke PD lain di PW yang sama', async () => {
      const result = await moveStrukturParentAction(
        pkItbId,
        pdBogorId,
        '01.PD-1.ITB'
      )

      expect(result.success).toBe(true)
      expect(await parentOf(pkItbId)).toBe(pdBogorId)
    })

    it('memindahkan PK langsung ke PW-nya', async () => {
      const result = await moveStrukturParentAction(
        pkItbId,
        pwJabarId,
        '01.PD-1.ITB'
      )

      expect(result.success).toBe(true)
      expect(await parentOf(pkItbId)).toBe(pwJabarId)
    })

    it('memindahkan PK dari PDLN ke PDLN lain', async () => {
      const result = await moveStrukturParentAction(
        pkKairoId,
        pdlnTurkiId,
        'PK.LN-1'
      )

      expect(result.success).toBe(true)
      expect(await parentOf(pkKairoId)).toBe(pdlnTurkiId)
    })

    it('menolak PK dari PDLN ke sebuah PW — pwCode berubah 99 ke 01', async () => {
      const result = await moveStrukturParentAction(
        pkKairoId,
        pwJabarId,
        'PK.LN-1'
      )

      expect(result.success).toBe(false)
      expect(result.message).toContain('Nomor Induk')
      expect(await parentOf(pkKairoId)).toBe(pdlnMesirId)
    })

    it('menolak pemindahan PD', async () => {
      for (const tujuan of [pwJatimId, pdBogorId, pwJabarId]) {
        const result = await moveStrukturParentAction(
          pdBandungId,
          tujuan,
          '01.PD-1'
        )
        expect(result.success).toBe(false)
      }

      expect(await parentOf(pdBandungId)).toBe(pwJabarId)
    })

    it('menolak PK ke PD di PW lain', async () => {
      const result = await moveStrukturParentAction(
        pkItbId,
        pdSurabayaId,
        '01.PD-1.ITB'
      )

      expect(result.success).toBe(false)
      expect(await parentOf(pkItbId)).toBe(pdBandungId)
    })

    it('mengubah parentId dan nol kolom lain, dan tidak menyeret Kader', async () => {
      const [sebelum] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, pkItbId))

      await moveStrukturParentAction(pkItbId, pdBogorId, '01.PD-1.ITB')

      const [sesudah] = await db
        .select()
        .from(organization)
        .where(eq(organization.id, pkItbId))

      expect({ ...sesudah, parentId: null }).toEqual({
        ...sebelum,
        parentId: null
      })
      expect(sesudah.parentId).toBe(pdBogorId)

      // Kader menunjuk Komisariat, bukan induknya, jadi ia tidak ke mana-mana —
      // dan Nomor Induk yang sudah terbit memang permanen.
      const [kader] = await db
        .select({
          organizationId: member.organizationId,
          registerNumber: member.registerNumber
        })
        .from(member)
        .where(eq(member.id, memberId))
      expect(kader.organizationId).toBe(pkItbId)
      expect(kader.registerNumber).toBe('01012024001')

      // Induk lamanya sendiri tidak disentuh.
      expect(await parentOf(pdBandungId)).toBe(pwJabarId)
    })

    it('menolak kode konfirmasi yang salah', async () => {
      const result = await moveStrukturParentAction(pkItbId, pdBogorId, 'salah')

      expect(result.success).toBe(false)
      expect(await parentOf(pkItbId)).toBe(pdBandungId)
    })

    it('menolak induk tujuan yang Non-Aktif', async () => {
      await db
        .update(organization)
        .set({ isNonActive: true })
        .where(eq(organization.id, pdBogorId))

      const result = await moveStrukturParentAction(
        pkItbId,
        pdBogorId,
        '01.PD-1.ITB'
      )

      expect(result.success).toBe(false)
      expect(await parentOf(pkItbId)).toBe(pdBandungId)
    })

    it('menjawab induk tujuan Terhapus seolah ia tidak pernah ada', async () => {
      await db
        .update(organization)
        .set({ deletedAt: new Date() })
        .where(eq(organization.id, pdBogorId))

      const result = await moveStrukturParentAction(
        pkItbId,
        pdBogorId,
        '01.PD-1.ITB'
      )

      expect(result.success).toBe(false)
      expect(result.message.toLowerCase()).not.toContain('hapus')
      expect(await parentOf(pkItbId)).toBe(pdBandungId)

      await db
        .update(organization)
        .set({ deletedAt: null })
        .where(eq(organization.id, pdBogorId))
    })

    it('menolak id yang bukan uuid tanpa menyentuh basis data', async () => {
      const result = await moveStrukturParentAction(
        'bukan-uuid',
        pdBogorId,
        '01.PD-1.ITB'
      )

      expect(result.success).toBe(false)
    })
  })

  describe('siapa yang boleh — nol sel baru di matriks', () => {
    it('menerima BPW PP', async () => {
      mockSession = sessionWith('bpw', ppId)
      const result = await moveStrukturParentAction(
        pkItbId,
        pdBogorId,
        '01.PD-1.ITB'
      )

      expect(result.success).toBe(true)
    })

    it('menolak BPD — punya sunting, nol buat', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      const result = await moveStrukturParentAction(
        pkItbId,
        pdBogorId,
        '01.PD-1.ITB'
      )

      expect(result.success).toBe(false)
      expect(await parentOf(pkItbId)).toBe(pdBandungId)
    })

    it('menolak BPKOM — Cakupannya tidak memuat induk tujuan', async () => {
      mockSession = sessionWith('bpw', pdBandungId)
      const result = await moveStrukturParentAction(
        pkItbId,
        pdBogorId,
        '01.PD-1.ITB'
      )

      expect(result.success).toBe(false)
    })

    it('menolak BPH', async () => {
      mockSession = sessionWith('bph', ppId)
      const result = await moveStrukturParentAction(
        pkItbId,
        pdBogorId,
        '01.PD-1.ITB'
      )

      expect(result.success).toBe(false)
    })

    it('menolak tanpa sesi', async () => {
      mockSession = undefined
      const result = await moveStrukturParentAction(
        pkItbId,
        pdBogorId,
        '01.PD-1.ITB'
      )

      expect(result.success).toBe(false)
      expect(await parentOf(pkItbId)).toBe(pdBandungId)
    })
  })

  describe('moveActiveChildrenToParentAction', () => {
    it('memindahkan seluruh anak Aktif ke induk sumbernya', async () => {
      const result = await moveActiveChildrenToParentAction(
        pdBandungId,
        '01.PD-1'
      )

      expect(result.success).toBe(true)
      expect(await parentOf(pkItbId)).toBe(pwJabarId)
      expect(await parentOf(pkUnpadId)).toBe(pwJabarId)
      expect(await parentOf(pkPasundanId)).toBe(pwJabarId)
    })

    it('meninggalkan anak Non-Aktif di tempatnya', async () => {
      await db
        .update(organization)
        .set({ isNonActive: true })
        .where(eq(organization.id, pkPasundanId))

      const result = await moveActiveChildrenToParentAction(
        pdBandungId,
        '01.PD-1'
      )

      expect(result.success).toBe(true)
      expect(await parentOf(pkItbId)).toBe(pwJabarId)
      expect(await parentOf(pkPasundanId)).toBe(pdBandungId)
    })

    it('menolak kode konfirmasi yang salah', async () => {
      const result = await moveActiveChildrenToParentAction(
        pdBandungId,
        'salah'
      )

      expect(result.success).toBe(false)
      expect(await parentOf(pkItbId)).toBe(pdBandungId)
    })

    it('menolak BPD', async () => {
      mockSession = sessionWith('bpw', pwJabarId)
      const result = await moveActiveChildrenToParentAction(
        pdBandungId,
        '01.PD-1'
      )

      expect(result.success).toBe(false)
      expect(await parentOf(pkItbId)).toBe(pdBandungId)
    })

    it('menolak Struktur tanpa anak Aktif', async () => {
      const result = await moveActiveChildrenToParentAction(
        pdBogorId,
        '01.PD-2'
      )

      expect(result.success).toBe(false)
    })

    it('menolak Struktur yang tidak punya induk', async () => {
      const result = await moveActiveChildrenToParentAction(ppId, 'PP-00')

      expect(result.success).toBe(false)
    })
  })
})
