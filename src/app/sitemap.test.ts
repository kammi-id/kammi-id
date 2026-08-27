import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test'

let host = 'pw-jabar.kammi.id'
let useFakeHeaders = true
let useFakeSitemapQuery = true

const actualNextHeaders = await import('next/headers')
const actualSitemapQuery = await import('~/db/query/sitemap')
const actualOrganizationQuery = await import('~/db/query/organization')
let struktur: {
  id: string
  type: string
  isSiteActive: boolean
  isNonActive: boolean
} | null = null

mock.module('next/headers', () => ({
  ...actualNextHeaders,
  headers: (...args: Parameters<typeof actualNextHeaders.headers>) =>
    useFakeHeaders
      ? Promise.resolve(new Headers({ host }))
      : actualNextHeaders.headers(...args)
}))

mock.module('~/db/query/organization', () => ({
  readOrganization: (
    ...args: Parameters<typeof actualOrganizationQuery.readOrganization>
  ) =>
    useFakeSitemapQuery
      ? (Promise.resolve(struktur ? [struktur] : []) as ReturnType<
          typeof actualOrganizationQuery.readOrganization
        >)
      : actualOrganizationQuery.readOrganization(...args)
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
  struktur = null
})

beforeEach(() => {
  host = 'pw-jabar.kammi.id'
  struktur = {
    id: 'pw-jabar',
    type: 'pw',
    isSiteActive: true,
    isNonActive: false
  }
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
    struktur = {
      id: 'pp',
      type: 'pp',
      isSiteActive: true,
      isNonActive: false
    }

    expect((await sitemap()).at(2)?.url).toBe(
      'https://kammi.id/berita/jaringan'
    )
  })

  it('kosong bagi Situs yang belum aktif atau Struktur Non-Aktif', async () => {
    struktur = {
      id: 'pw-jabar',
      type: 'pw',
      isSiteActive: false,
      isNonActive: false
    }
    expect(await sitemap()).toEqual([])

    struktur = {
      id: 'pw-jabar',
      type: 'pw',
      isSiteActive: true,
      isNonActive: true
    }
    expect(await sitemap()).toEqual([])
  })

  it('kosong untuk host yang tidak dikenali', async () => {
    host = 'attacker.example'

    expect(await sitemap()).toEqual([])
  })
})
