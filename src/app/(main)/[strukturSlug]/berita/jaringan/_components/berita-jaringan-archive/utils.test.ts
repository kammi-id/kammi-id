import { describe, expect, it } from 'bun:test'
import { beritaJaringanPermalinkUrl, beritaJaringanPageHref } from './utils'

describe('beritaJaringanPermalinkUrl', () => {
  it('points at the apex for a PP article', () => {
    expect(
      beritaJaringanPermalinkUrl({
        slug: 'kabar-pusat',
        publishedAt: new Date('2026-02-10T06:00:00.000Z'),
        organization: { type: 'pp', slug: 'pp-kammi' }
      })
    ).toBe('https://kammi.id/berita/2026/02/kabar-pusat')
  })

  it('points at the organization subdomain for a non-PP publisher', () => {
    expect(
      beritaJaringanPermalinkUrl({
        slug: 'kabar-wilayah',
        publishedAt: new Date('2026-03-15T12:00:00.000Z'),
        organization: { type: 'pw', slug: 'pw-jawa-barat' }
      })
    ).toBe('https://pw-jawa-barat.kammi.id/berita/2026/03/kabar-wilayah')
  })
})

describe('beritaJaringanPageHref', () => {
  it('points page 1 (and below) at the bare /berita/jaringan path', () => {
    expect(beritaJaringanPageHref(1)).toBe('/berita/jaringan')
    expect(beritaJaringanPageHref(0)).toBe('/berita/jaringan')
    expect(beritaJaringanPageHref(-3)).toBe('/berita/jaringan')
  })

  it('appends ?page=N for any page beyond the first', () => {
    expect(beritaJaringanPageHref(2)).toBe('/berita/jaringan?page=2')
    expect(beritaJaringanPageHref(48)).toBe('/berita/jaringan?page=48')
  })
})

// `buildPaginationItems` moved to `~/lib/utils/pagination` — its tests live
// there now.
