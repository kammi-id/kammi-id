import { beforeEach, describe, expect, it, mock } from 'bun:test'

// Sama seperti `berita/feed.xml/route.test.ts` — seam-nya di data layer
// (`_data/struktur` dan `db/query/article`) karena indeks ini tidak lewat
// `resolveOutcome` (bukan satu Artikel, tapi daftar).

let organizationId: string | null = 'org-1'
let identity: { id: string; name: string; slug: string; type: string } | null =
  { id: 'org-1', name: 'PW Jabar', slug: 'pw-jabar', type: 'pw' }

mock.module('~/app/(main)/_data/struktur', () => ({
  resolveStrukturIdFromParams: async () => organizationId,
  getStrukturIdentity: async () => identity
}))

mock.module('~/db/query/article', () => ({
  listBeritaFeedForOrg: async () => [
    {
      id: 'a1',
      title: 'Kabar Terbaru',
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
}))

const { GET } = await import('./route')

beforeEach(() => {
  organizationId = 'org-1'
  identity = { id: 'org-1', name: 'PW Jabar', slug: 'pw-jabar', type: 'pw' }
})

describe('GET /berita.md (indeks Salinan Markdown)', () => {
  it('membalas 200 dengan Content-Type dan header Link canonical ke /berita', async () => {
    const res = await GET(new Request('https://pw-jabar.kammi.id/berita.md'), {
      params: Promise.resolve({ strukturSlug: 'pw-jabar' })
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(res.headers.get('link')).toBe(
      '<https://pw-jabar.kammi.id/berita>; rel="canonical"'
    )
  })

  it('mendaftar judul, tanggal, ringkasan, dan tautan `.md` tiap Berita', async () => {
    const res = await GET(new Request('https://pw-jabar.kammi.id/berita.md'), {
      params: Promise.resolve({ strukturSlug: 'pw-jabar' })
    })

    const text = await res.text()
    expect(text).toContain('Kabar Terbaru')
    expect(text).toContain('Ringkasan berita ini.')
    expect(text).toContain(
      'https://pw-jabar.kammi.id/berita/2026/08/kabar-terbaru.md'
    )
  })

  it('menjawab 404 ketika Situs tidak dapat dinavigasi', async () => {
    organizationId = null

    const res = await GET(new Request('https://pw-jabar.kammi.id/berita.md'), {
      params: Promise.resolve({ strukturSlug: 'pw-jabar' })
    })

    expect(res.status).toBe(404)
  })
})
