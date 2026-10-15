import { describe, it, expect } from 'bun:test'
import {
  deriveTahunBulanTerbit,
  isTerbit,
  wibWallClockToPublishedAt,
  publishedAtToWibWallClock,
  formatTanggalTerbit,
  toWibIsoString
} from './tanggal-terbit'

describe('publication instants with canonical WIB dates', () => {
  it('keeps January permalinks for 06:00 WIB even when the UTC date is December', () => {
    const instant = new Date('2025-12-31T23:00:00Z')
    expect(deriveTahunBulanTerbit(instant)).toEqual({ tahun: 2026, bulan: 1 })
    expect(formatTanggalTerbit(instant)).toBe('1 Januari 2026')
    expect(toWibIsoString(instant)).toBe('2026-01-01T06:00:00+07:00')
  })

  it('uses WIB at the month boundary, including midnight', () => {
    expect(deriveTahunBulanTerbit(new Date('2026-01-31T16:59:59Z'))).toEqual({
      tahun: 2026,
      bulan: 1
    })
    expect(deriveTahunBulanTerbit(new Date('2026-01-31T17:00:00Z'))).toEqual({
      tahun: 2026,
      bulan: 2
    })
  })

  it('compares publication instants without a second timezone adjustment', () => {
    const instant = new Date('2026-10-15T06:53:00Z')
    expect(isTerbit(instant, new Date('2026-10-15T06:52:59Z'))).toBe(false)
    expect(isTerbit(instant, instant)).toBe(true)
    expect(isTerbit(instant, new Date('2026-10-15T07:00:00Z'))).toBe(true)
    expect(isTerbit(null, instant)).toBe(false)
  })

  it('roundtrips WIB wall clocks as real instants', () => {
    const instant = wibWallClockToPublishedAt('2026-01-01T06:00')!
    expect(instant.toISOString()).toBe('2025-12-31T23:00:00.000Z')
    expect(publishedAtToWibWallClock(instant)).toBe('2026-01-01T06:00')
    expect(wibWallClockToPublishedAt('2026-02-30T06:00')).toBeNull()
    expect(wibWallClockToPublishedAt('bad')).toBeNull()
  })
})
