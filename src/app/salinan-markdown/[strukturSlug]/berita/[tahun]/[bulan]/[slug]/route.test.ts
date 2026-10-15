import { beforeEach, describe, expect, it, mock } from 'bun:test'

// Sama seperti `berita/feed.xml/route.test.ts`: `mock.module` pada seam
// data, lalu impor `GET` sesudahnya. Di sini seam-nya `resolveOutcome` dari
// `page.tsx` — bukan DB tiga lapis di bawahnya — supaya uji ini fokus pada
// apa yang DILAKUKAN route dengan tiap jenis outcome (not-found/redirect/ok),
// bukan menurunkan ulang fixture DB yang sudah diuji tersendiri lewat
// `_permalink-berita.test.ts`.

let outcomeResult: {
  organizationId: string | null
  isNonActive: boolean
  articleRow:
    | {
        title: string
        publishedAt: Date | null
        penulis: string | null
        tags: string[]
        body: unknown
      }
    | undefined
  org: { type: string; slug: string; name: string } | undefined
  outcome:
    | { kind: 'not-found' }
    | { kind: 'redirect'; to: string }
    | { kind: 'ok'; noindex: boolean }
    | null
} = {
  organizationId: null,
  isNonActive: false,
  articleRow: undefined,
  org: undefined,
  outcome: null
}

mock.module(
  '~/app/(main)/[strukturSlug]/berita/[tahun]/[bulan]/[slug]/page',
  () => ({
    resolveOutcome: async () => outcomeResult
  })
)

const { GET } = await import('./route')

const params = Promise.resolve({
  strukturSlug: 'pw-jabar',
  tahun: '2026',
  bulan: '09',
  slug: 'judul-contoh'
})

beforeEach(() => {
  outcomeResult = {
    organizationId: null,
    isNonActive: false,
    articleRow: undefined,
    org: undefined,
    outcome: null
  }
})

describe('GET /berita/[tahun]/[bulan]/[slug].md (Salinan Markdown Berita)', () => {
  it('menjawab 404 (badan kosong) untuk Berita draft', async () => {
    outcomeResult = {
      organizationId: 'org-1',
      isNonActive: false,
      articleRow: undefined,
      org: undefined,
      outcome: { kind: 'not-found' }
    }

    const res = await GET(
      new Request('https://pw-jabar.kammi.id/berita/2026/09/judul-contoh.md', {
        headers: { 'x-kammi-md-suffix': '1' }
      }),
      { params }
    )

    expect(res.status).toBe(404)
    expect(await res.text()).toBe('')
  })

  it('menjawab 404 untuk Berita terjadwal (published, tanggal belum lewat) — sama seperti Permalink HTML', async () => {
    outcomeResult = {
      organizationId: 'org-1',
      isNonActive: false,
      articleRow: undefined,
      org: undefined,
      outcome: { kind: 'not-found' }
    }

    const res = await GET(
      new Request('https://pw-jabar.kammi.id/berita/2026/09/judul-contoh.md', {
        headers: { 'x-kammi-md-suffix': '1' }
      }),
      { params }
    )

    expect(res.status).toBe(404)
  })

  it('mengalihkan 308 ke alamat kanonik ber-`.md` ketika request masuk membawa suffix (riwayat/tahun-bulan tak kanonik)', async () => {
    outcomeResult = {
      organizationId: 'org-1',
      isNonActive: false,
      articleRow: undefined,
      org: undefined,
      outcome: { kind: 'redirect', to: '/berita/2026/09/judul-baru' }
    }

    const res = await GET(
      new Request('https://pw-jabar.kammi.id/berita/2026/08/judul-lama.md', {
        headers: { 'x-kammi-md-suffix': '1' }
      }),
      { params }
    )

    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe(
      'https://pw-jabar.kammi.id/berita/2026/09/judul-baru.md'
    )
  })

  it('mengalihkan 308 TANPA `.md` ketika request masuk lewat content negotiation (tanpa suffix)', async () => {
    outcomeResult = {
      organizationId: 'org-1',
      isNonActive: false,
      articleRow: undefined,
      org: undefined,
      outcome: { kind: 'redirect', to: '/berita/2026/09/judul-baru' }
    }

    const res = await GET(
      new Request('https://pw-jabar.kammi.id/berita/2026/08/judul-lama', {
        headers: { accept: 'text/markdown', 'x-kammi-md-suffix': '0' }
      }),
      { params }
    )

    expect(res.status).toBe(308)
    expect(res.headers.get('location')).toBe(
      'https://pw-jabar.kammi.id/berita/2026/09/judul-baru'
    )
  })

  it('membalas 200 dengan Content-Type, header Link canonical, dan front-matter pada outcome ok', async () => {
    outcomeResult = {
      organizationId: 'org-1',
      isNonActive: false,
      articleRow: {
        title: 'Aksi "Bela Palestina": Seruan Solidaritas',
        publishedAt: new Date('2026-09-01T06:00:00.000Z'),
        penulis: 'Budi Santoso',
        tags: ['aksi', 'palestina'],
        body: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Isi berita contoh.' }]
            }
          ]
        }
      },
      org: { type: 'pw', slug: 'pw-jabar', name: 'PW Jabar' },
      outcome: { kind: 'ok', noindex: false }
    }

    const res = await GET(
      new Request('https://pw-jabar.kammi.id/berita/2026/09/judul-contoh.md', {
        headers: { 'x-kammi-md-suffix': '1' }
      }),
      { params }
    )

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(res.headers.get('link')).toBe(
      '<https://pw-jabar.kammi.id/berita/2026/09/judul-contoh>; rel="canonical"'
    )

    const text = await res.text()
    expect(text).toContain(
      'title: "Aksi \\"Bela Palestina\\": Seruan Solidaritas"'
    )
    expect(text).toContain(
      'canonical: "https://pw-jabar.kammi.id/berita/2026/09/judul-contoh"'
    )
    expect(text).toContain('organization: "PW Jabar"')
    expect(text).toContain('author: "Budi Santoso"')
    expect(text).toContain('tags: ["aksi", "palestina"]')
    expect(text).toContain('# Aksi "Bela Palestina": Seruan Solidaritas')
    expect(text).toContain('Isi berita contoh.')
  })

  it('menjawab 404 ketika Situs/Struktur tidak dapat dinavigasi', async () => {
    outcomeResult = {
      organizationId: null,
      isNonActive: false,
      articleRow: undefined,
      org: undefined,
      outcome: null
    }

    const res = await GET(
      new Request('https://tidak-ada.kammi.id/berita/2026/09/judul-contoh.md'),
      { params }
    )

    expect(res.status).toBe(404)
  })
})
