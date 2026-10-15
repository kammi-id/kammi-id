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
import { article } from '~/db/schema/article.sql'
import { NO_PUBLISHED_ARTICLE_MESSAGE } from './constants'

let mockSession: unknown = undefined

mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => mockSession
}))

mock.module('next/cache', () => ({
  updateTag: () => {}
}))

const { setSiteActiveAction } = await import('./action')

/**
 * Tiket 03, spec "Aktivasi Situs". `requireSiteSettingsAccess` sudah diuji
 * sendiri; yang diuji di sini adalah rakitan aksinya — gerbang akses lalu
 * prasyarat Berita Terbit, kolom yang benar-benar berubah, dan bahwa Humas
 * tidak pernah bisa membidik Struktur lain karena aksinya sama sekali tidak
 * menerima id target (parameter satu-satunya adalah `nextActive`).
 *
 * Fixture bersufiks, dibereskan sendiri, tanpa `TRUNCATE` — mengikuti
 * preseden `struktur-keadaan/action.test.ts`.
 */
describe('setSiteActiveAction', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []
  const articleIds: string[] = []

  let orgWithBeritaId: string
  let orgWithoutBeritaId: string

  const seedOrg = async (name: string, isSiteActive: boolean) => {
    const [row] = await db
      .insert(organization)
      .values({
        name: `${name} ${suffix}`,
        slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
        code: `${name.replace(/\s+/g, '')}.${suffix}`,
        type: 'pk',
        isNonActive: false,
        isSiteActive
      })
      .returning({ id: organization.id })
    orgIds.unshift(row.id)
    return row.id
  }

  const siteActiveOf = async (id: string) => {
    const [row] = await db
      .select({ isSiteActive: organization.isSiteActive })
      .from(organization)
      .where(eq(organization.id, id))
    return row?.isSiteActive
  }

  const sessionOf = (role: string, connectedOrganizationId: string | null) => ({
    user: {
      id: 'actor-id',
      role,
      connectedOrganization: connectedOrganizationId
        ? { id: connectedOrganizationId }
        : null,
      connectedMember: null
    }
  })

  beforeAll(async () => {
    orgWithBeritaId = await seedOrg('Struktur Berita', false)
    orgWithoutBeritaId = await seedOrg('Struktur Kosong', false)

    const [row] = await db
      .insert(article)
      .values({
        organizationId: orgWithBeritaId,
        type: 'blog',
        title: `Berita ${suffix}`,
        slug: `berita-${suffix}`,
        body: { type: 'doc', content: [] },
        status: 'published',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60)
      })
      .returning({ id: article.id })
    articleIds.push(row.id)
  })

  afterAll(async () => {
    await db.delete(article).where(inArray(article.id, articleIds))
    await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  beforeEach(async () => {
    mockSession = undefined
    await db
      .update(organization)
      .set({ isSiteActive: false })
      .where(inArray(organization.id, orgIds))
  })

  it('menolak tanpa sesi', async () => {
    const result = await setSiteActiveAction(true)

    expect(result.success).toBe(false)
    expect(result.message).toBe('Akses ditolak.')
  })

  it('menolak peran selain root dan humas', async () => {
    mockSession = sessionOf('bpk', orgWithBeritaId)

    const result = await setSiteActiveAction(true)

    expect(result.success).toBe(false)
    expect(await siteActiveOf(orgWithBeritaId)).toBe(false)
  })

  it('Humas menolak menyala selama Strukturnya belum punya Berita Terbit, dengan pesan syaratnya', async () => {
    mockSession = sessionOf('humas', orgWithoutBeritaId)

    const result = await setSiteActiveAction(true)

    expect(result.success).toBe(false)
    expect(result.message).toBe(NO_PUBLISHED_ARTICLE_MESSAGE)
    expect(await siteActiveOf(orgWithoutBeritaId)).toBe(false)
  })

  it('Humas menyalakan Situs Strukturnya sendiri begitu ada Berita Terbit', async () => {
    mockSession = sessionOf('humas', orgWithBeritaId)

    const result = await setSiteActiveAction(true)

    expect(result.success).toBe(true)
    expect(result.isActive).toBe(true)
    expect(await siteActiveOf(orgWithBeritaId)).toBe(true)
  })

  it('mematikan Situs selalu diizinkan, tanpa syarat Berita Terbit', async () => {
    await db
      .update(organization)
      .set({ isSiteActive: true })
      .where(eq(organization.id, orgWithoutBeritaId))
    mockSession = sessionOf('humas', orgWithoutBeritaId)

    const result = await setSiteActiveAction(false)

    expect(result.success).toBe(true)
    expect(result.isActive).toBe(false)
    expect(await siteActiveOf(orgWithoutBeritaId)).toBe(false)
  })

  it('Root menyalakan Situs Struktur yang terhubung ke sesinya sendiri, sama seperti Humas', async () => {
    mockSession = sessionOf('root', orgWithBeritaId)

    const result = await setSiteActiveAction(true)

    expect(result.success).toBe(true)
    expect(await siteActiveOf(orgWithBeritaId)).toBe(true)
  })

  it('Humas tidak dapat menyentuh Situs Struktur lain — aksinya tidak menerima id target sama sekali, hanya sesinya sendiri yang berubah', async () => {
    mockSession = sessionOf('humas', orgWithBeritaId)

    await setSiteActiveAction(true)

    expect(await siteActiveOf(orgWithBeritaId)).toBe(true)
    expect(await siteActiveOf(orgWithoutBeritaId)).toBe(false)
  })
})
