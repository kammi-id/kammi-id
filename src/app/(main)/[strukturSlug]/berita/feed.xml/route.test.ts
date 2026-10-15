import { beforeEach, describe, expect, it, mock } from 'bun:test'

let organizationId: string | null = 'pw-jabar'
let seenOrganizationId: string | null = null
let identity: {
  id: string
  name: string
  slug: string
  type: string
  level: number
  logo: string | null
} | null = {
  id: 'pw-jabar',
  name: 'PW Jabar',
  slug: 'pw-jabar',
  type: 'pw',
  level: 2,
  logo: null
}

mock.module('~/app/(main)/_data/struktur', () => ({
  resolveStrukturIdFromParams: async () => organizationId,
  getStrukturIdentity: async () => identity
}))

mock.module('~/db/query/article', () => ({
  listBeritaFeedForOrg: async (id: string) => {
    seenOrganizationId = id
    return [
      {
        id: 'berita-1',
        title: 'Kabar & Terbaru',
        slug: 'kabar-terbaru',
        publishedAt: new Date('2026-08-02T00:00:00.000Z'),
        updatedAt: new Date('2026-08-03T00:00:00.000Z'),
        penulis: 'Budi Santoso',
        body: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Ringkasan berita ini.' }]
            }
          ]
        }
      }
    ]
  }
}))

const { GET } = await import('./route')

beforeEach(() => {
  organizationId = 'pw-jabar'
  seenOrganizationId = null
  identity = {
    id: 'pw-jabar',
    name: 'PW Jabar',
    slug: 'pw-jabar',
    type: 'pw',
    level: 2,
    logo: null
  }
})

describe('GET /berita/feed.xml', () => {
  it('menggunakan daftar Berita Struktur untuk RSS pada host peminta', async () => {
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

  it('memperkaya channel: language, lastBuildDate, dan atom:link rel=self', async () => {
    const response = await GET(
      new Request('https://pw-jabar.kammi.id/berita/feed.xml'),
      { params: Promise.resolve({ strukturSlug: 'pw-jabar' }) }
    )
    const body = await response.text()

    expect(body).toContain('<language>id-ID</language>')
    expect(body).toContain('<lastBuildDate>')
    expect(body).toContain(
      '<atom:link rel="self" type="application/rss+xml" href="https://pw-jabar.kammi.id/berita/feed.xml" />'
    )
  })

  it('mengisi description per item dari ringkasan turunan body', async () => {
    const response = await GET(
      new Request('https://pw-jabar.kammi.id/berita/feed.xml'),
      { params: Promise.resolve({ strukturSlug: 'pw-jabar' }) }
    )
    const body = await response.text()

    expect(body).toContain('<description>Ringkasan berita ini.</description>')
  })

  it('mengisi dc:creator ketika Berita punya Penulis', async () => {
    const response = await GET(
      new Request('https://pw-jabar.kammi.id/berita/feed.xml'),
      { params: Promise.resolve({ strukturSlug: 'pw-jabar' }) }
    )
    const body = await response.text()

    expect(body).toContain('<dc:creator>Budi Santoso</dc:creator>')
  })

  it('tidak memasang <image> ketika Struktur tidak punya logo', async () => {
    const response = await GET(
      new Request('https://pw-jabar.kammi.id/berita/feed.xml'),
      { params: Promise.resolve({ strukturSlug: 'pw-jabar' }) }
    )
    const body = await response.text()

    expect(body).not.toContain('<image>')
  })

  it('memasang <image> dari logo Struktur ketika ada', async () => {
    identity = {
      id: 'pw-jabar',
      name: 'PW Jabar',
      slug: 'pw-jabar',
      type: 'pw',
      level: 2,
      logo: '/api/images/logo-pw-jabar.png'
    }

    const response = await GET(
      new Request('https://pw-jabar.kammi.id/berita/feed.xml'),
      { params: Promise.resolve({ strukturSlug: 'pw-jabar' }) }
    )
    const body = await response.text()

    expect(body).toContain(
      '<url>https://pw-jabar.kammi.id/api/images/logo-pw-jabar.png</url>'
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

  it('menggunakan Host peminta, bukan origin server di balik proxy', async () => {
    const response = await GET(
      {
        url: 'http://127.0.0.1:3010/berita/feed.xml',
        headers: new Headers({ host: 'pw-jabar.kammi.id' })
      } as Request,
      { params: Promise.resolve({ strukturSlug: 'pw-jabar' }) }
    )

    expect(await response.text()).toContain(
      'https://pw-jabar.kammi.id/berita/2026/8/kabar-terbaru'
    )
  })
})
