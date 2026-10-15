import { describe, expect, test } from 'bun:test'
import {
  instantToWallClock,
  wallClockToInstant,
  detectPublicationTimezone
} from './timezone'
import { deriveTahunBulanTerbit, isTerbit } from './tanggal-terbit'

describe('publication timezone input', () => {
  test('14:53 WITA is immediately eligible at 13:53 WIB', () => {
    const instant = wallClockToInstant('2026-10-15T14:53', 'Asia/Makassar')!
    expect(instant.toISOString()).toBe('2026-10-15T06:53:00.000Z')
    expect(instantToWallClock(instant, 'Asia/Jakarta')).toBe('2026-10-15T13:53')
    expect(instantToWallClock(instant, 'Asia/Jayapura')).toBe(
      '2026-10-15T15:53'
    )
    expect(isTerbit(instant, new Date('2026-10-15T06:53:00Z'))).toBe(true)
  })
  test('timezone changes preserve the instant and canonical WIB month', () => {
    const instant = wallClockToInstant('2026-02-01T00:30', 'Asia/Makassar')!
    const wib = instantToWallClock(instant, 'Asia/Jakarta')
    expect(wib).toBe('2026-01-31T23:30')
    expect(wallClockToInstant(wib, 'Asia/Jakarta')).toEqual(instant)
    expect(deriveTahunBulanTerbit(instant)).toEqual({ tahun: 2026, bulan: 1 })
  })
  test('detects Indonesian offsets and gives unsupported zones an explicit WIB fallback', () => {
    const now = new Date('2026-10-15T00:00:00Z')
    expect(detectPublicationTimezone('Asia/Makassar', now)).toBe(
      'Asia/Makassar'
    )
    expect(detectPublicationTimezone('Asia/Singapore', now)).toBe(
      'Asia/Makassar'
    )
    expect(detectPublicationTimezone('Asia/Tokyo', now)).toBe('Asia/Jayapura')
    expect(detectPublicationTimezone('Australia/Darwin', now)).toBe(
      'Asia/Jakarta'
    )
    expect(detectPublicationTimezone('America/New_York', now)).toBe(
      'Asia/Jakarta'
    )
  })
})
