import { describe, expect, test } from 'bun:test'
import {
  EVENT_TIMEZONES,
  eventEffectiveEnd,
  eventInstantToWallClock,
  eventWallClockToInstant
} from './event'

describe('Event time and validation', () => {
  for (const [index, zone] of EVENT_TIMEZONES.entries()) {
    test(`${zone.label}: wall clock is independent of machine timezone`, () => {
      const start = eventWallClockToInstant('2026-01-01T00:30', zone.value)!
      expect(start.toISOString()).toBe(`2025-12-31T${17 - index}:30:00.000Z`)
      expect(eventInstantToWallClock(start, zone.value)).toBe(
        '2026-01-01T00:30'
      )
      expect(eventEffectiveEnd(start, null, zone.value).toISOString()).toBe(
        `2026-01-01T${17 - index}:00:00.000Z`
      )
      expect(
        eventEffectiveEnd(
          start,
          new Date('2026-01-03T04:00Z'),
          zone.value
        ).toISOString()
      ).toBe('2026-01-03T04:00:00.000Z')
    })
  }
  test('rejects impossible dates and malformed wall clock', () => {
    for (const value of ['2026-02-30T08:00', '2026-01-01T24:00', 'bad'])
      expect(eventWallClockToInstant(value, 'Asia/Jakarta')).toBeNull()
  })
})
