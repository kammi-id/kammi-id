import { describe, expect, it } from 'bun:test'
import { beritaPermalinkPath } from './utils'

describe('beritaPermalinkPath', () => {
  it('derives tahun/bulan from the instant in Asia/Jakarta', () => {
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
    // 23:00 WIB is 16:00 UTC; migration must preserve this calendar date.
    expect(
      beritaPermalinkPath({
        slug: 'akhir-tahun',
        publishedAt: new Date('2025-12-31T16:00:00.000Z')
      })
    ).toBe('/berita/2025/12/akhir-tahun')
  })
})
