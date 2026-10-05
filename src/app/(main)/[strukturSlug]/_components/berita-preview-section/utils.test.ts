import { describe, expect, it } from 'bun:test'
import { beritaPermalinkPath } from './utils'

describe('beritaPermalinkPath', () => {
  it('derives tahun/bulan from the UTC fields of publishedAt (Jakarta wall-clock digits)', () => {
    expect(
      beritaPermalinkPath({
        slug: 'contoh-berita',
        publishedAt: new Date('2026-01-01T06:00:00.000Z')
      })
    ).toBe('/berita/2026/01/contoh-berita')
  })

  it('pads a single-digit bulan with a leading zero', () => {
    expect(
      beritaPermalinkPath({
        slug: 'gambaran-maret',
        publishedAt: new Date('2026-03-15T12:00:00.000Z')
      })
    ).toBe('/berita/2026/03/gambaran-maret')
  })

  it('does not shift a late-year publishedAt into the next year — the ADR 0014 regression case', () => {
    // A naive derivation that applies the *process's own local timezone*
    // (`getFullYear`/`getMonth`) instead of reading `publishedAt`'s raw
    // digits (`getUTCFullYear`/`getUTCMonth`) would, on a server not running
    // in UTC, shift this into a different month or year. Asserting against
    // the literal stored digits (2025-12-31) is exactly what guards that.
    expect(
      beritaPermalinkPath({
        slug: 'akhir-tahun',
        publishedAt: new Date('2025-12-31T23:00:00.000Z')
      })
    ).toBe('/berita/2025/12/akhir-tahun')
  })
})
