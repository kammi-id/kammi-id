import { beforeEach, describe, expect, it, mock } from 'bun:test'

// Sama seperti seam `resolveOutcome` pada uji route Berita — mock langsung
// pada `page.tsx`, bukan DB tiga lapis di bawahnya.

let outcomeResult: {
  organizationId: string | null
  articleRow:
    | {
        title: string
        slug: string
        updatedAt: Date
        penulis: string | null
        tags: string[]
        body: unknown
      }
    | undefined
  identity: { type: string; slug: string; name: string } | null
  outcome: { kind: 'not-found' } | { kind: 'ok'; noindex: boolean } | null
} = {
  organizationId: null,
  articleRow: undefined,
  identity: null,
  outcome: null
}

mock.module('~/app/(main)/[strukturSlug]/[slug]/page', () => ({
  resolveOutcome: async () => outcomeResult
}))

const { GET } = await import('./route')

const params = Promise.resolve({
  strukturSlug: 'pw-jabar',
  slug: 'tentang-kami'
})

beforeEach(() => {
  outcomeResult = {
    organizationId: null,
    articleRow: undefined,
    identity: null,
    outcome: null
  }
})

describe('GET /[slug].md (Salinan Markdown Halaman)', () => {
  it('menjawab 404 (badan kosong) untuk Halaman draft', async () => {
    outcomeResult = {
      organizationId: 'org-1',
      articleRow: undefined,
      identity: null,
      outcome: { kind: 'not-found' }
    }

    const res = await GET(
      new Request('https://pw-jabar.kammi.id/tentang-kami.md', {
        headers: { 'x-kammi-md-suffix': '1' }
      }),
      { params }
    )

    expect(res.status).toBe(404)
    expect(await res.text()).toBe('')
  })

  it('membalas 200 dengan Content-Type, header Link canonical, dan front-matter pada outcome ok', async () => {
    outcomeResult = {
      organizationId: 'org-1',
      articleRow: {
        title: 'Kajian Rutin: Fiqih Muamalah',
        slug: 'tentang-kami',
        updatedAt: new Date('2026-08-15T03:00:00.000Z'),
        penulis: null,
        tags: [],
        body: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Isi halaman contoh.' }]
            }
          ]
        }
      },
      identity: { type: 'pw', slug: 'pw-jabar', name: 'PW Jabar' },
      outcome: { kind: 'ok', noindex: false }
    }

    const res = await GET(
      new Request('https://pw-jabar.kammi.id/tentang-kami.md', {
        headers: { 'x-kammi-md-suffix': '1' }
      }),
      { params }
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(res.headers.get('link')).toBe(
      '<https://pw-jabar.kammi.id/tentang-kami>; rel="canonical"'
    )

    const text = await res.text()
    expect(text).toContain('title: "Kajian Rutin: Fiqih Muamalah"')
    expect(text).toContain(
      'canonical: "https://pw-jabar.kammi.id/tentang-kami"'
    )
    expect(text).toContain('organization: "PW Jabar"')
    expect(text).toContain('author: null')
    expect(text).toContain('tags: []')
    expect(text).toContain('# Kajian Rutin: Fiqih Muamalah')
    expect(text).toContain('Isi halaman contoh.')
  })

  it('menjawab 404 ketika Situs/Struktur tidak dapat dinavigasi', async () => {
    outcomeResult = {
      organizationId: null,
      articleRow: undefined,
      identity: null,
      outcome: null
    }

    const res = await GET(
      new Request('https://tidak-ada.kammi.id/tentang-kami.md'),
      { params }
    )

    expect(res.status).toBe(404)
  })
})
