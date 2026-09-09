import { describe, it, expect } from 'bun:test'
import {
  buildWebSite,
  buildOrganization,
  buildBreadcrumb,
  buildArticle,
  buildWebPage,
  strukturOrganizationId,
  type StrukturJsonLdOrganization
} from '~/lib/seo/json-ld'

const pp: StrukturJsonLdOrganization = {
  type: 'pp',
  slug: 'pp',
  name: 'Kesatuan Aksi Mahasiswa Muslim Indonesia',
  logo: 'https://www.kammi.id/icon1.png',
  parent: null,
  children: [{ type: 'pw', slug: 'aceh' }]
}

const pwAceh: StrukturJsonLdOrganization = {
  type: 'pw',
  slug: 'aceh',
  name: 'KAMMI Wilayah Aceh',
  parent: { type: 'pp', slug: 'pp' },
  children: []
}

describe('strukturOrganizationId', () => {
  it("builds PP's @id off the apex host, not its own slug", () => {
    expect(strukturOrganizationId({ type: 'pp', slug: 'pp' })).toBe(
      'https://www.kammi.id/#organization'
    )
  })

  it('builds a subdomain @id for a non-PP Struktur', () => {
    expect(strukturOrganizationId({ type: 'pw', slug: 'aceh' })).toBe(
      'https://aceh.kammi.id/#organization'
    )
  })
})

describe('buildWebSite', () => {
  it("follows PP's own name, url, and publisher @id", () => {
    const result = buildWebSite(pp)
    expect(result['@type']).toBe('WebSite')
    expect(result.name).toBe('Kesatuan Aksi Mahasiswa Muslim Indonesia')
    expect(result.url).toBe('https://www.kammi.id')
    expect(result.publisher).toEqual({
      '@id': 'https://www.kammi.id/#organization'
    })
  })

  it('produces a different @id/name/url for a different Struktur', () => {
    const result = buildWebSite(pwAceh)
    expect(result.name).toBe('KAMMI Wilayah Aceh')
    expect(result.url).toBe('https://aceh.kammi.id')
    expect(result.publisher).toEqual({
      '@id': 'https://aceh.kammi.id/#organization'
    })
  })
})

describe('buildOrganization', () => {
  it('returns Organization @type with a stable @id off the Struktur host', () => {
    const result = buildOrganization(pp)
    expect(result['@type']).toBe('Organization')
    expect(result['@id']).toBe('https://www.kammi.id/#organization')
    expect(result.name).toBe('Kesatuan Aksi Mahasiswa Muslim Indonesia')
    expect(result.alternateName).toBe('KAMMI')
    expect(result.url).toBe('https://www.kammi.id')
    expect(result.logo).toBe('https://www.kammi.id/icon1.png')
  })

  it('includes sameAs (Wikidata, Wikipedia, and the 6 social links) only for PP', () => {
    const result = buildOrganization(pp)
    expect(result.sameAs).toHaveLength(8)
    expect(result.sameAs).toContain('https://www.wikidata.org/wiki/Q85992000')
    expect(result.sameAs).toContain(
      'https://id.wikipedia.org/wiki/Kesatuan_Aksi_Mahasiswa_Muslim_Indonesia'
    )
    expect(result.sameAs).toContain('https://twitter.com/KAMMIPusat')
    expect(result.sameAs).toContain('https://www.instagram.com/kammi.pusat')
    expect(result.sameAs).toContain('https://www.instagram.com/kammi.connect')
    expect(result.sameAs).toContain(
      'https://www.facebook.com/kammipusat.official'
    )
    expect(result.sameAs).toContain('https://www.youtube.com/@kammitv8247')
    expect(result.sameAs).toContain('https://www.tiktok.com/@kammi.pusat')
  })

  it('produces a different @id/name/url for a regional Struktur, and no sameAs', () => {
    const result = buildOrganization(pwAceh)
    expect(result['@id']).toBe('https://aceh.kammi.id/#organization')
    expect(result.name).toBe('KAMMI Wilayah Aceh')
    expect(result.url).toBe('https://aceh.kammi.id')
    expect(result.sameAs).toBeUndefined()
    expect(result.alternateName).toBeUndefined()
  })

  it('omits logo entirely (not an empty string) when the Struktur has none', () => {
    const result = buildOrganization(pwAceh)
    expect('logo' in result).toBe(false)
  })

  it("points parentOrganization at the direct induk's @id, and omits it for PP", () => {
    const child = buildOrganization(pwAceh)
    expect(child.parentOrganization).toEqual({
      '@id': 'https://www.kammi.id/#organization'
    })

    const root = buildOrganization(pp)
    expect(root.parentOrganization).toBeUndefined()
  })

  it('lists direct anak only in subOrganization, and omits it when there are none', () => {
    const root = buildOrganization(pp)
    expect(root.subOrganization).toEqual([
      { '@id': 'https://aceh.kammi.id/#organization' }
    ])

    const leaf = buildOrganization(pwAceh)
    expect(leaf.subOrganization).toBeUndefined()
  })

  it('excludes a Non-Aktif, Terhapus, or site-inactive child from subOrganization (filtered upstream by the caller)', () => {
    // The caller in `_data/struktur.ts` is responsible for filtering before
    // this pure function ever sees the list (ADR 0013) — this test proves
    // the builder itself just reflects whatever `children` it is handed,
    // so a caller that filters correctly gets a correct result here.
    const withoutDeadChild: StrukturJsonLdOrganization = {
      ...pp,
      children: []
    }
    const result = buildOrganization(withoutDeadChild)
    expect(result.subOrganization).toBeUndefined()
  })
})

describe('buildBreadcrumb', () => {
  it('builds BreadcrumbList with correct positions and absolute item URLs off the given Struktur host', () => {
    const result = buildBreadcrumb(
      [
        { name: 'Beranda', url: '/' },
        { name: 'Tentang', url: '/tentang' }
      ],
      { type: 'pp', slug: 'pp' }
    )
    expect(result['@type']).toBe('BreadcrumbList')
    expect(result.itemListElement).toHaveLength(2)
    expect(result.itemListElement[0].position).toBe(1)
    expect(result.itemListElement[0].name).toBe('Beranda')
    expect(result.itemListElement[0].item).toBe('https://www.kammi.id/')
    expect(result.itemListElement[1].position).toBe(2)
    expect(result.itemListElement[1].item).toBe('https://www.kammi.id/tentang')
  })

  it('uses the subdomain host for a non-PP Struktur — not PP, the bug ticket 03 fixes', () => {
    const result = buildBreadcrumb([{ name: 'Beranda', url: '/' }], {
      type: 'pw',
      slug: 'aceh'
    })
    expect(result.itemListElement[0].item).toBe('https://aceh.kammi.id/')
  })

  it('handles a single-item breadcrumb', () => {
    const result = buildBreadcrumb([{ name: 'Beranda', url: '/' }], {
      type: 'pp',
      slug: 'pp'
    })
    expect(result.itemListElement).toHaveLength(1)
    expect(result.itemListElement[0].position).toBe(1)
  })
})

describe('buildArticle', () => {
  const base = {
    headline: 'Judul Berita',
    description: 'Ringkasan Berita.',
    datePublished: '2026-01-01T00:00:00.000Z',
    dateModified: '2026-01-02T00:00:00.000Z',
    keywords: ['kaderisasi', 'aceh'],
    url: 'https://aceh.kammi.id/berita/2026/01/judul-berita',
    publisher: { type: 'pw', slug: 'aceh' } as const
  }

  it('returns Article (not NewsArticle) with mainEntityOfPage pointing at the permalink', () => {
    const result = buildArticle(base)
    expect(result['@type']).toBe('Article')
    expect(result.headline).toBe('Judul Berita')
    expect(result.inLanguage).toBe('id-ID')
    expect(result.mainEntityOfPage).toEqual({
      '@type': 'WebPage',
      '@id': base.url
    })
  })

  it("publisher references the Struktur's @id, not a copied Organization object", () => {
    const result = buildArticle(base)
    expect(result.publisher).toEqual({
      '@id': 'https://aceh.kammi.id/#organization'
    })
  })

  it('author is a Person when authorName is present', () => {
    const result = buildArticle({ ...base, authorName: 'Budi Santoso' })
    expect(result.author).toEqual({ '@type': 'Person', name: 'Budi Santoso' })
  })

  it("author falls back to the Struktur's @id when authorName is absent", () => {
    const result = buildArticle(base)
    expect(result.author).toEqual({
      '@id': 'https://aceh.kammi.id/#organization'
    })
  })

  it('omits image, articleSection, and keywords when not provided', () => {
    const result = buildArticle({ ...base, keywords: [] })
    expect('image' in result).toBe(false)
    expect('articleSection' in result).toBe(false)
    expect('keywords' in result).toBe(false)
  })

  it('includes image and articleSection when provided', () => {
    const result = buildArticle({
      ...base,
      image: 'https://aceh.kammi.id/api/images/x.png',
      articleSection: 'Kaderisasi'
    })
    expect(result.image).toBe('https://aceh.kammi.id/api/images/x.png')
    expect(result.articleSection).toBe('Kaderisasi')
  })
})

describe('buildWebPage', () => {
  it('returns WebPage (not Article) with the given fields', () => {
    const result = buildWebPage({
      name: 'Tentang Kami',
      description: 'Ringkasan Halaman.',
      url: 'https://aceh.kammi.id/tentang-kami'
    })
    expect(result['@type']).toBe('WebPage')
    expect(result.name).toBe('Tentang Kami')
    expect(result.description).toBe('Ringkasan Halaman.')
    expect(result.url).toBe('https://aceh.kammi.id/tentang-kami')
    expect(result.inLanguage).toBe('id-ID')
  })
})
