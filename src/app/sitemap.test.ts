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

let host = 'pw-jabar.kammi.id'
let useFakeHeaders = true
let useFakeSitemapQuery = true

const actualNextHeaders = await import('next/headers')
const actualSitemapQuery = await import('~/db/query/sitemap')
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
              publishedAt: new Date('2026-08-02T00:00:00.000Z')
            }
          ]
        })
      : actualSitemapQuery.listSitemapArticlesForOrg(...args)
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

  it('menambahkan Berita Jaringan hanya pada Situs PP', async () => {
    host = 'kammi.id'

    expect((await sitemap()).at(2)?.url).toBe(
      'https://kammi.id/berita/jaringan'
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
