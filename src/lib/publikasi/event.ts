import {
  INDONESIAN_TIMEZONES,
  instantToWallClock,
  wallClockToInstant,
  type IndonesianTimezone
} from './timezone'

export const EVENT_TIMEZONES = INDONESIAN_TIMEZONES
export type EventTimezone = IndonesianTimezone
export const eventInstantToWallClock = instantToWallClock
export const eventWallClockToInstant = wallClockToInstant

const TIMEZONE_OFFSETS: Record<EventTimezone, number> = {
  'Asia/Jakarta': 7,
  'Asia/Makassar': 8,
  'Asia/Jayapura': 9
}
const HOUR_MS = 3_600_000

export const eventEffectiveEnd = (
  startsAt: Date,
  endsAt: Date | null,
  timezone: EventTimezone
): Date => {
  if (endsAt) return endsAt

  const offsetMs = TIMEZONE_OFFSETS[timezone] * HOUR_MS
  const local = new Date(startsAt.getTime() + offsetMs)
  local.setUTCHours(24, 0, 0, 0)
  return new Date(local.getTime() - offsetMs)
}

export const formatEventDate = (
  date: Date,
  timezone: EventTimezone
): string => {
  const formatted = new Intl.DateTimeFormat('id-ID', {
    timeZone: timezone,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).format(date)
  const label = EVENT_TIMEZONES.find((zone) => zone.value === timezone)?.label
  return `${formatted} ${label}`
}
