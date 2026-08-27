import { beforeEach, describe, expect, it, mock } from 'bun:test'

let organizationId: string | null = 'pw-jabar'
let seenOrganizationId: string | null = null

mock.module('~/app/(main)/_data/struktur', () => ({
  resolveStrukturIdFromParams: async () => organizationId
}))

mock.module('~/db/query/article', () => ({
  listBeritaArsipForOrg: async (id: string) => {
    seenOrganizationId = id
    return {
      items: [
        {
          id: 'berita-1',
          title: 'Kabar & Terbaru',
          slug: 'kabar-terbaru',
          publishedAt: new Date('2026-08-02T00:00:00.000Z'),
          organization: { name: 'PW Jabar' }
        }
      ]
    }
  }
}))

const { GET } = await import('./route')

beforeEach(() => {
  organizationId = 'pw-jabar'
  seenOrganizationId = null
})

describe('GET /berita/feed.xml', () => {
  it('menggunakan daftar arsip Struktur untuk RSS pada host peminta', async () => {
    const response = await GET(
      new Request('https://pw-jabar.kammi.id/berita/feed.xml'),
      { params: Promise.resolve({ strukturSlug: 'pw-jabar' }) }
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain(
      'application/rss+xml'
    )
    expect(seenOrganizationId).toBe('pw-jabar')

    const body = await response.text()
    expect(body).toContain('<title>PW Jabar</title>')
    expect(body).toContain('Kabar &amp; Terbaru')
    expect(body).toContain(
      'https://pw-jabar.kammi.id/berita/2026/8/kabar-terbaru'
    )
  })

  it('menjawab tidak ditemukan ketika Situs tidak dapat dinavigasi', async () => {
    organizationId = null

    const response = await GET(
      new Request('https://pw-jabar.kammi.id/berita/feed.xml'),
      { params: Promise.resolve({ strukturSlug: 'pw-jabar' }) }
    )

    expect(response.status).toBe(404)
  })
})
