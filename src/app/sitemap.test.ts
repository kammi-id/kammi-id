import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock
} from 'bun:test'
import { eq, sql } from 'drizzle-orm'
import { db } from '~/db/db'
import { createOrganization } from '~/db/query/organization'
import { organization } from '~/db/schema/organization.sql'
import { upsertSiteSettings } from '~/db/query/site-settings'

let host = 'pw-jabar.kammi.id'
let useFakeHeaders = true
let useFakeSitemapQuery = true
let beritaUpdatedAt = new Date('2026-08-02T00:00:00.000Z')
let forceDbFailure = false

const actualNextHeaders = await import('next/headers')
const actualSitemapQuery = await import('~/db/query/sitemap')
const actualOrganizationQuery = await import('~/db/query/organization')
let pwJabarId: string

mock.module('next/headers', () => ({
  ...actualNextHeaders,
  headers: (...args: Parameters<typeof actualNextHeaders.headers>) =>
    useFakeHeaders
      ? Promise.resolve(new Headers({ host }))
      : actualNextHeaders.headers(...args)
}))

mock.module('~/db/query/sitemap', () => ({
  ...actualSitemapQuery,
  listSitemapArticlesForOrg: (
    ...args: Parameters<typeof actualSitemapQuery.listSitemapArticlesForOrg>
  ) =>
    useFakeSitemapQuery
      ? Promise.resolve({
          halaman: [
            {
              slug: 'tentang-kami',
              updatedAt: new Date('2026-08-01T00:00:00.000Z')
            }
          ],
          berita: [
            {
              slug: 'kabar-terbaru',
              publishedAt: new Date('2026-08-02T00:00:00.000Z'),
              updatedAt: beritaUpdatedAt
            }
          ]
        })
      : actualSitemapQuery.listSitemapArticlesForOrg(...args)
}))

// Reference captured BEFORE `mock.module` runs below — `mock.module`
// rewrites `readOrganization` on the same live module namespace object, so
// calling `actualOrganizationQuery.readOrganization` from inside the mock
// factory itself would call the mock, not the real implementation
// (infinite recursion). A variable captured ahead of time holds the
// original function value regardless of that later rewrite.
const realReadOrganization = actualOrganizationQuery.readOrganization

mock.module('~/db/query/organization', () => ({
  ...actualOrganizationQuery,
  readOrganization: (
    ...args: Parameters<typeof actualOrganizationQuery.readOrganization>
  ) => {
    if (forceDbFailure) throw new Error('db down')
    return realReadOrganization(...args)
  }
}))

const { default: sitemap } = await import('./sitemap')

afterAll(() => {
  useFakeHeaders = false
  useFakeSitemapQuery = false
})

beforeAll(async () => {
  await db.execute(sql`TRUNCATE TABLE "user", "member", organization CASCADE`)

  const [pp] = await createOrganization({
    name: 'PP KAMMI',
    slug: 'pp-kammi',
    code: 'PP-00',
    type: 'pp',
    parentId: null,
    isNonActive: false
  })
  const [pwJabar] = await createOrganization({
    name: 'PW Jabar',
    slug: 'pw-jabar',
    code: 'PW-32',
    type: 'pw',
    parentId: pp.id,
    isNonActive: false
  })

  pwJabarId = pwJabar.id
  await db
    .update(organization)
    .set({ isSiteActive: true })
    .where(eq(organization.id, pwJabarId))
})

beforeEach(() => {
  host = 'pw-jabar.kammi.id'
  beritaUpdatedAt = new Date('2026-08-02T00:00:00.000Z')
  forceDbFailure = false
})

describe('sitemap', () => {
  it('memetakan hanya permukaan publik milik Situs Struktur pada host permintaan', async () => {
    const entries = await sitemap()

    expect(entries.map((entry) => entry.url)).toEqual([
      'https://pw-jabar.kammi.id',
      'https://pw-jabar.kammi.id/berita',
      'https://pw-jabar.kammi.id/event',
      'https://pw-jabar.kammi.id/tentang',
      'https://pw-jabar.kammi.id/tentang/pengurus',
      'https://pw-jabar.kammi.id/tentang-kami',
      'https://pw-jabar.kammi.id/berita/2026/8/kabar-terbaru'
    ])
  })

  it('tidak memasang changeFrequency atau priority — keduanya dinyatakan diabaikan Google dan Bing', async () => {
    const entries = await sitemap()

    for (const entry of entries) {
      expect(entry).not.toHaveProperty('changeFrequency')
      expect(entry).not.toHaveProperty('priority')
    }
  })

  it('rute yang benar-benar statis (/berita, /event) tidak memasang lastModified yang dikarang', async () => {
    const entries = await sitemap()
    const berita = entries.find((e) => e.url.endsWith('/berita'))
    const event = entries.find((e) => e.url.endsWith('/event'))

    expect(berita).not.toHaveProperty('lastModified')
    expect(event).not.toHaveProperty('lastModified')
  })

  it('Berita di sitemap memakai updatedAt sebagai lastModified', async () => {
    beritaUpdatedAt = new Date('2026-08-10T00:00:00.000Z')

    const entries = await sitemap()
    const berita = entries.find((e) =>
      e.url.endsWith('/berita/2026/8/kabar-terbaru')
    )

    expect(berita?.lastModified).toEqual(beritaUpdatedAt)
  })

  it('Berita jatuh balik ke publishedAt kalau updatedAt lebih awal (baris draft lama)', async () => {
    beritaUpdatedAt = new Date('2020-01-01T00:00:00.000Z')

    const entries = await sitemap()
    const berita = entries.find((e) =>
      e.url.endsWith('/berita/2026/8/kabar-terbaru')
    )

    expect(berita?.lastModified).toEqual(
      new Date('2026-08-02T00:00:00.000Z')
    )
  })

  it('beranda memasang lastModified dari Pengaturan Situs begitu Struktur pernah menyimpannya', async () => {
    const before = await sitemap()
    expect(before.find((e) => e.url === 'https://pw-jabar.kammi.id')).not
      .toHaveProperty('lastModified')

    await upsertSiteSettings('about', { paragraph1: 'x' }, pwJabarId)

    const after = await sitemap()
    const beranda = after.find((e) => e.url === 'https://pw-jabar.kammi.id')
    expect(beranda?.lastModified).toBeInstanceOf(Date)
  })

  it('kosong (bukan meledak 500) ketika basis data tidak terjangkau', async () => {
    forceDbFailure = true

    expect(await sitemap()).toEqual([])
  })

  it('menambahkan Berita KAMMI se-Indonesia hanya pada Situs PP', async () => {
    host = 'kammi.id'

    expect((await sitemap()).at(2)?.url).toBe(
      'https://kammi.id/berita/seindonesia'
    )
  })

  it('kosong bagi Situs yang belum aktif atau Struktur Non-Aktif', async () => {
    await db
      .update(organization)
      .set({ isSiteActive: false })
      .where(eq(organization.id, pwJabarId))
    expect(await sitemap()).toEqual([])

    await db
      .update(organization)
      .set({ isSiteActive: true, isNonActive: true })
      .where(eq(organization.id, pwJabarId))
    expect(await sitemap()).toEqual([])
  })

  it('kosong untuk host yang tidak dikenali', async () => {
    host = 'attacker.example'

    expect(await sitemap()).toEqual([])
  })
})
