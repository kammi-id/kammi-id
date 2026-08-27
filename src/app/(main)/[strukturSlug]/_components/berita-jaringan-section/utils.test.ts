import { describe, expect, it } from 'bun:test'
import { beritaJaringanPermalinkUrl } from './utils'

describe('beritaJaringanPermalinkUrl', () => {
  it('points at the apex for a PP article, not a subdomain', () => {
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
