import { describe, it, expect } from 'bun:test'
import {
  buildWebSite,
  buildOrganization,
  buildBreadcrumb
} from '~/lib/seo/json-ld'

describe('buildWebSite', () => {
  it('returns WebSite @type with correct url and name', () => {
    const result = buildWebSite()
    expect(result['@type']).toBe('WebSite')
    expect(result.url).toBe('https://kammi.id')
    expect(result.name).toBe('KAMMI.id')
  })
})

describe('buildOrganization', () => {
  it('returns Organization @type with full name and alternateName', () => {
    const result = buildOrganization()
    expect(result['@type']).toBe('Organization')
    expect(result.name).toBe('Kesatuan Aksi Mahasiswa Muslim Indonesia')
    expect(result.alternateName).toBe('KAMMI')
    expect(result.logo).toBe('https://kammi.id/icon1.png')
  })

  it('includes all 6 social media sameAs entries', () => {
    const result = buildOrganization()
    expect(result.sameAs).toHaveLength(6)
    expect(result.sameAs).toContain('https://twitter.com/KAMMIPusat')
    expect(result.sameAs).toContain('https://www.instagram.com/kammi.pusat')
    expect(result.sameAs).toContain('https://www.instagram.com/kammi.connect')
    expect(result.sameAs).toContain(
      'https://www.facebook.com/kammipusat.official'
    )
    expect(result.sameAs).toContain('https://www.youtube.com/@kammitv8247')
    expect(result.sameAs).toContain('https://www.tiktok.com/@kammi.pusat')
  })
})

describe('buildBreadcrumb', () => {
  it('builds BreadcrumbList with correct positions and absolute item URLs', () => {
    const result = buildBreadcrumb([
      { name: 'Beranda', url: '/' },
      { name: 'Tentang', url: '/tentang' }
    ])
    expect(result['@type']).toBe('BreadcrumbList')
    expect(result.itemListElement).toHaveLength(2)
    expect(result.itemListElement[0].position).toBe(1)
    expect(result.itemListElement[0].name).toBe('Beranda')
    expect(result.itemListElement[0].item).toBe('https://kammi.id/')
    expect(result.itemListElement[1].position).toBe(2)
    expect(result.itemListElement[1].item).toBe('https://kammi.id/tentang')
  })

  it('handles a single-item breadcrumb', () => {
    const result = buildBreadcrumb([{ name: 'Beranda', url: '/' }])
    expect(result.itemListElement).toHaveLength(1)
    expect(result.itemListElement[0].position).toBe(1)
  })
})
