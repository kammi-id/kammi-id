import { describe, expect, it } from 'bun:test'
import { beritaArsipPermalinkPath, beritaArsipPageHref } from './utils'

describe('beritaArsipPermalinkPath', () => {
  it('derives tahun/bulan from the UTC fields of publishedAt (ADR 0014 wall-clock digits)', () => {
    expect(
      beritaArsipPermalinkPath({
        slug: 'contoh-arsip',
        publishedAt: new Date('2026-01-01T06:00:00.000Z')
      })
    ).toBe('/berita/2026/01/contoh-arsip')
  })

  it('pads a single-digit bulan with a leading zero', () => {
    expect(
      beritaArsipPermalinkPath({
        slug: 'gambaran-maret',
        publishedAt: new Date('2026-03-15T12:00:00.000Z')
      })
    ).toBe('/berita/2026/03/gambaran-maret')
  })
})

describe('beritaArsipPageHref', () => {
  it('points page 1 (and below) at the bare /berita path — no noisy ?page=1', () => {
    expect(beritaArsipPageHref(1)).toBe('/berita')
    expect(beritaArsipPageHref(0)).toBe('/berita')
    expect(beritaArsipPageHref(-3)).toBe('/berita')
  })

  it('appends ?page=N for any page beyond the first', () => {
    expect(beritaArsipPageHref(2)).toBe('/berita?page=2')
    expect(beritaArsipPageHref(48)).toBe('/berita?page=48')
  })
})

// `buildPaginationItems` moved to `~/lib/utils/pagination` (shared by every
// Berita archive's pagination nav) — its tests live there now.
