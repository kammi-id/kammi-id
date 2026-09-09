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

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  revalidatePath: () => {},
  updateTag: () => {}
}))

const { updateOrganizationProfileAction } = await import('./action')

/**
 * Tiket 25, spec §8.1, §2.4, §4.3. Fixture bersufiks, dibereskan sendiri.
 *
 * Dua klaim yang hanya bisa dibuktikan end-to-end: bahwa `code`, `type`, dan
 * `parentId` yang dikirim **diabaikan** alih-alih dipercaya — form yang tidak
 * punya kotaknya tidak membuktikan apa pun tentang Server Action yang bisa
 * dicapai tanpa form — dan bahwa slug bentrok mendarat di **field**, bukan di
 * toast.
 */
describe('aksi profil Struktur', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []

  let pwId: string
  let penyaingId: string

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

  const rowOf = async (id: string) => {
    const [row] = await db
      .select({
        name: organization.name,
        slug: organization.slug,
        code: organization.code,
        type: organization.type,
        parentId: organization.parentId
      })
      .from(organization)
      .where(eq(organization.id, id))
    return row
  }

  const sessionOf = (role: string, organizationId: string | null) => ({
    user: {
      id: 'pelaku-profil',
      role,
      connectedOrganization: organizationId ? { id: organizationId } : null,
      connectedMember: null
    }
  })

  const submit = (values: Record<string, string>) => {
    const formData = new FormData()
    for (const [key, value] of Object.entries(values)) {
      formData.set(key, value)
    }
    return updateOrganizationProfileAction({}, formData)
  }

  beforeAll(async () => {
    pwId = await seed('PW Profil', `PW7`, 'pw', null)
    penyaingId = await seed('PW Penyaing Profil', `PW6`, 'pw', null)
  })

  afterAll(async () => {
    await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  beforeEach(async () => {
    mockSession = sessionOf('bph', pwId)
    await db
      .update(organization)
      .set({
        name: `PW Profil ${suffix}`,
        slug: `pw-profil-${suffix}`,
        code: 'PW7',
        parentId: null
      })
      .where(eq(organization.id, pwId))
  })

  it('menyimpan nama, slug, dan logo Struktur terhubungnya sendiri', async () => {
    const result = await submit({
      name: `PW Profil Baru ${suffix}`,
      slug: `pw-profil-baru-${suffix}`,
      logo: 'logos/baru.png'
    })

    expect(result.success).toBe(true)
    const row = await rowOf(pwId)
    expect(row?.name).toBe(`PW Profil Baru ${suffix}`)
    expect(row?.slug).toBe(`pw-profil-baru-${suffix}`)
  })

  it('mengabaikan `code`, `type`, dan `parentId` yang dikirim — beku untuk semua orang', async () => {
    const result = await submit({
      name: `PW Profil ${suffix}`,
      slug: `pw-profil-${suffix}`,
      code: 'DIBAJAK',
      type: 'pp',
      parentId: penyaingId
    })

    expect(result.success).toBe(true)
    const row = await rowOf(pwId)
    expect(row?.code).toBe('PW7')
    expect(row?.type).toBe('pw')
    expect(row?.parentId).toBeNull()
  })

  it('menaruh slug bentrok di field slug, bukan di pesan umum', async () => {
    const result = await submit({
      name: `PW Profil ${suffix}`,
      slug: `pw-penyaing-profil-${suffix}`
    })

    expect(result.success).toBe(false)
    expect(result.errors?.slug?.[0]).toMatch(/sudah dipakai/i)
    expect(result.message).toBeUndefined()
    expect((await rowOf(pwId))?.slug).toBe(`pw-profil-${suffix}`)
  })

  it('menolak Kewenangan selain BPH', async () => {
    for (const role of ['root', 'bpw', 'bpk', 'humas', 'member']) {
      mockSession = sessionOf(role, pwId)
      const result = await submit({
        name: `Dibajak ${suffix}`,
        slug: `dibajak-${suffix}`
      })
      expect(result.success).toBe(false)
    }
    expect((await rowOf(pwId))?.name).toBe(`PW Profil ${suffix}`)
  })

  it('menolak BPH tanpa Struktur terhubung', async () => {
    mockSession = sessionOf('bph', null)

    const result = await submit({
      name: `Dibajak ${suffix}`,
      slug: `dibajak-${suffix}`
    })

    expect(result.success).toBe(false)
  })

  it('menolak tanpa sesi', async () => {
    mockSession = undefined

    const result = await submit({
      name: `Dibajak ${suffix}`,
      slug: `dibajak-${suffix}`
    })

    expect(result.success).toBe(false)
  })
})
