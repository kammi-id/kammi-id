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

const { deactivateStrukturAction, reactivateStrukturAction } =
  await import('./action')

/**
 * Tiket 21, spec §1.5, §2.3, §6.4. Aturan murninya sudah diuji sebagai tabel di
 * `src/lib/struktur/keadaan.test.ts`; yang diuji di sini adalah **rakitannya** —
 * urutan gate lalu prasyarat, kolom jejak yang benar-benar terisi dan
 * terkosongkan, dan penolakan yang membawa cukup bahan untuk permukaannya.
 *
 * Fixture-nya bersufiks dan dibereskan sendiri, **tanpa `TRUNCATE`**. Empat
 * belas berkas tes di repo ini sudah berebut menyapu tabel yang sama, dan
 * berkas kelima belas yang ikut menyapu membuat urutan jalannya jadi bagian
 * dari hasilnya. Konsekuensinya Struktur di sini di-`insert` mentah alih-alih
 * lewat `createOrganization`: yang terakhir mencetak Akun bernama persis
 * `root` untuk tiap PP, dan `user.name` unik — jadi memakainya *mengharuskan*
 * menyapu lebih dulu.
 */
describe('aksi nonaktifkan dan aktifkan', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []

  let ppId: string
  let pwId: string
  let pdBandungId: string
  let pdBogorId: string
  let pkItbId: string
  let pkUnpadId: string
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

  const stateOf = async (id: string) => {
    const [row] = await db
      .select({
        state: organization.state,
        isNonActive: organization.isNonActive,
        nonActiveAt: organization.nonActiveAt,
        nonActiveBy: organization.nonActiveBy
      })
      .from(organization)
      .where(eq(organization.id, id))
    return row
  }

  const setNonActive = async (id: string, value: boolean) => {
    await db
      .update(organization)
      .set({
        isNonActive: value,
        nonActiveAt: value ? new Date() : null,
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
    // Kode Struktur dibuat unik juga: penurunan NIA membacanya, dan dua pohon
    // tes yang berbagi kode akan saling menjelaskan kegagalan yang salah.
    ppId = await seed('PP Keadaan', `PP-${suffix}`, 'pp', null)
    pwId = await seed('PW Keadaan', `PW9`, 'pw', ppId)
    pdBandungId = await seed('PD Bandung Keadaan', `99.PD-1`, 'pd', pwId)
    pdBogorId = await seed('PD Bogor Keadaan', `99.PD-2`, 'pd', pwId)
    pkItbId = await seed('PK Itb Keadaan', `99.PD-1.ITB`, 'pk', pdBandungId)
    pkUnpadId = await seed('PK Unpad Keadaan', `99.PD-1.UNP`, 'pk', pdBandungId)

    // `non_active_by` is a foreign key, so the trace has to point at a real row.
    const [actor] = await db
      .insert(userTable)
      .values({
        name: `pelaku-keadaan-${suffix}`,
        displayName: `Pelaku Keadaan ${suffix}`,
        passwordHash: 'x',
        role: 'root'
      })
      .returning({ id: userTable.id })
    actorId = actor.id
  })

  // Struktur dibuang lebih dulu, baru pelakunya. Urutannya bukan selera:
  // `non_active_by` sengaja NO ACTION (tiket 13) — jejak yang bisa dikosongkan
  // diam-diam oleh penghapusan baris lain bukan jejak — jadi Akun yang pernah
  // bertindak atas sebuah Struktur tidak bisa pergi lebih dulu.
  afterAll(async () => {
    await db.delete(organization).where(inArray(organization.id, orgIds))
    await db.delete(userTable).where(eq(userTable.id, actorId))
  })

  beforeEach(async () => {
    mockSession = sessionOf('root', null)
    for (const id of orgIds) await setNonActive(id, false)
  })

  describe('nonaktifkan', () => {
    it('menolak PP, siapa pun pelakunya', async () => {
      const result = await deactivateStrukturAction(ppId, `PP-${suffix}`)

      expect(result.success).toBe(false)
      expect((await stateOf(ppId))?.state).toBe('aktif')
    })

    it('menolak PP dengan alasan yang benar, bukan dengan alasan kewenangan', async () => {
      // Sesi Root: kalau penolakannya berbunyi soal hak akses, ia menjawab
      // pertanyaan yang salah (§2.3). Yang menolak bukan Kewenangan — memang
      // tidak ada yang punya sel itu — melainkan bahwa keadaannya tak berarti.
      const result = await deactivateStrukturAction(ppId, `PP-${suffix}`)

      expect(result.message).toBe(
        'Kepengurusan pusat tidak dapat dinonaktifkan.'
      )
      expect(result.message).not.toMatch(/hak akses/i)
    })

    it('menolak induk yang masih punya anak Aktif, dengan hitungan di galatnya', async () => {
      const result = await deactivateStrukturAction(pdBandungId, '99.PD-1')

      expect(result.success).toBe(false)
      expect(result.message).toContain('2')
      expect(result.message).toContain('Komisariat')
    })

    it('menyerahkan id anak Aktif-nya supaya permukaan bisa menawarkan pemindahan', async () => {
      const result = await deactivateStrukturAction(pdBandungId, '99.PD-1')

      expect(result.activeChildren?.map((c) => c.id).sort()).toEqual(
        [pkItbId, pkUnpadId].sort()
      )
    })

    it('berhasil begitu seluruh anaknya sudah Non-Aktif — mereka boleh ditinggal', async () => {
      await setNonActive(pkItbId, true)
      await setNonActive(pkUnpadId, true)

      const result = await deactivateStrukturAction(pdBandungId, '99.PD-1')

      expect(result.success).toBe(true)
      expect((await stateOf(pdBandungId))?.state).toBe('non_aktif')
    })

    it('mengisi jejak non_active_at dan non_active_by', async () => {
      await deactivateStrukturAction(pkItbId, '99.PD-1.ITB')

      const row = await stateOf(pkItbId)
      expect(row?.nonActiveAt).toBeInstanceOf(Date)
      expect(row?.nonActiveBy).toBe(actorId)
    })

    it('menolak kode konfirmasi yang tidak sesuai', async () => {
      const result = await deactivateStrukturAction(pkItbId, 'SALAH')

      expect(result.success).toBe(false)
      expect((await stateOf(pkItbId))?.state).toBe('aktif')
    })

    it('menolak tanpa sesi', async () => {
      mockSession = undefined

      const result = await deactivateStrukturAction(pkItbId, '99.PD-1.ITB')

      expect(result.success).toBe(false)
      expect((await stateOf(pkItbId))?.state).toBe('aktif')
    })

    it('menolak Kewenangan yang tidak memegang selnya', async () => {
      mockSession = sessionOf('bpk', pwId)

      const result = await deactivateStrukturAction(pkItbId, '99.PD-1.ITB')

      expect(result.success).toBe(false)
      expect((await stateOf(pkItbId))?.state).toBe('aktif')
    })

    it('tidak menyentuh anak yang Non-Aktif saat induknya dinonaktifkan', async () => {
      await setNonActive(pkItbId, true)
      await setNonActive(pkUnpadId, true)
      await deactivateStrukturAction(pdBandungId, '99.PD-1')

      expect((await stateOf(pkItbId))?.state).toBe('non_aktif')
      expect((await stateOf(pkUnpadId))?.state).toBe('non_aktif')
    })
  })

  describe('aktifkan kembali', () => {
    it('menolak anak yang induknya Non-Aktif — aturan cermin', async () => {
      await setNonActive(pdBogorId, true)
      await setNonActive(pwId, true)

      const result = await reactivateStrukturAction(pdBogorId, '99.PD-2')

      expect(result.success).toBe(false)
      expect(result.message).toMatch(/[Aa]ktifkan induk/)
      expect((await stateOf(pdBogorId))?.state).toBe('non_aktif')
    })

    it('berhasil begitu induknya hidup lagi', async () => {
      await setNonActive(pdBogorId, true)

      const result = await reactivateStrukturAction(pdBogorId, '99.PD-2')

      expect(result.success).toBe(true)
      expect((await stateOf(pdBogorId))?.state).toBe('aktif')
    })

    it('mengosongkan jejak non_active_at dan non_active_by', async () => {
      await deactivateStrukturAction(pdBogorId, '99.PD-2')
      await reactivateStrukturAction(pdBogorId, '99.PD-2')

      const row = await stateOf(pdBogorId)
      expect(row?.isNonActive).toBe(false)
      expect(row?.nonActiveAt).toBeNull()
      expect(row?.nonActiveBy).toBeNull()
    })

    it('tidak ikut menghidupkan anaknya', async () => {
      await setNonActive(pkItbId, true)
      await setNonActive(pkUnpadId, true)
      await setNonActive(pdBandungId, true)

      await reactivateStrukturAction(pdBandungId, '99.PD-1')

      expect((await stateOf(pdBandungId))?.state).toBe('aktif')
      expect((await stateOf(pkItbId))?.state).toBe('non_aktif')
      expect((await stateOf(pkUnpadId))?.state).toBe('non_aktif')
    })

    it('dipegang Kewenangan yang sama dengan penonaktifannya', async () => {
      mockSession = sessionOf('bpw', pdBandungId)
      await setNonActive(pkItbId, true)

      const result = await reactivateStrukturAction(pkItbId, '99.PD-1.ITB')

      expect(result.success).toBe(true)
    })
  })
})
