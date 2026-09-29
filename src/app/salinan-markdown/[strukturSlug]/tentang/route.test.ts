import { beforeEach, describe, expect, it, mock } from 'bun:test'

let organizationId: string | null = 'org-1'
let identity: { id: string; name: string; slug: string; type: string } | null =
  { id: 'org-1', name: 'PW Jabar', slug: 'pw-jabar', type: 'pw' }
let lastUpdate: Date | undefined = new Date('2026-08-03T00:00:00.000Z')

mock.module('~/app/(main)/_data/struktur', () => ({
  resolveStrukturIdFromParams: async () => organizationId,
  getStrukturIdentity: async () => identity
}))

mock.module('~/db/query/site-settings', () => ({
  readLatestSettingsUpdate: async () => lastUpdate
}))

const { GET } = await import('./route')

beforeEach(() => {
  organizationId = 'org-1'
  identity = { id: 'org-1', name: 'PW Jabar', slug: 'pw-jabar', type: 'pw' }
  lastUpdate = new Date('2026-08-03T00:00:00.000Z')
})

describe('GET /tentang.md (Salinan Markdown Tentang)', () => {
  it('membalas 200 dengan Content-Type dan header Link canonical ke /tentang', async () => {
    const res = await GET(new Request('https://pw-jabar.kammi.id/tentang.md'), {
      params: Promise.resolve({ strukturSlug: 'pw-jabar' })
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8')
    expect(res.headers.get('link')).toBe(
      '<https://pw-jabar.kammi.id/tentang>; rel="canonical"'
    )
  })

  it('menuliskan Visi, Misi, Prinsip, Paradigma, dan Kredo sebagai heading', async () => {
    const res = await GET(new Request('https://pw-jabar.kammi.id/tentang.md'), {
      params: Promise.resolve({ strukturSlug: 'pw-jabar' })
    })

    const text = await res.text()
    expect(text).toContain('## Visi')
    expect(text).toContain('## Misi')
    expect(text).toContain('## Prinsip Gerakan')
    expect(text).toContain('## Paradigma Gerakan')
    expect(text).toContain('## Kredo Gerakan')
    // Urutan sama dengan `tentang-scene.tsx` yang benar-benar dirender.
    const visiIndex = text.indexOf('## Visi')
    const misiIndex = text.indexOf('## Misi')
    const prinsipIndex = text.indexOf('## Prinsip Gerakan')
    const paradigmaIndex = text.indexOf('## Paradigma Gerakan')
    const kredoIndex = text.indexOf('## Kredo Gerakan')
    expect(visiIndex).toBeLessThan(misiIndex)
    expect(misiIndex).toBeLessThan(prinsipIndex)
    expect(prinsipIndex).toBeLessThan(paradigmaIndex)
    expect(paradigmaIndex).toBeLessThan(kredoIndex)
  })

  it('tidak menuliskan Karakteristik, Unsur, atau Sejarah — kode mati, bukan bagian HTML yang dirender', async () => {
    const res = await GET(new Request('https://pw-jabar.kammi.id/tentang.md'), {
      params: Promise.resolve({ strukturSlug: 'pw-jabar' })
    })

    const text = await res.text()
    expect(text).not.toContain('Karakteristik')
    expect(text).not.toContain('## Unsur')
    expect(text).not.toContain('## Sejarah')
  })

  it('mengisi `date` front-matter dari waktu pembaruan Pengaturan Situs', async () => {
    const res = await GET(new Request('https://pw-jabar.kammi.id/tentang.md'), {
      params: Promise.resolve({ strukturSlug: 'pw-jabar' })
    })

    const text = await res.text()
    expect(text).toContain('date: "2026-08-03T00:00:00+07:00"')
  })

  it('menjawab 404 ketika Situs tidak dapat dinavigasi', async () => {
    organizationId = null

    const res = await GET(new Request('https://pw-jabar.kammi.id/tentang.md'), {
      params: Promise.resolve({ strukturSlug: 'pw-jabar' })
    })

    expect(res.status).toBe(404)
  })
})
