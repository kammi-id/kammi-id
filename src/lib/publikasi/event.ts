export const EVENT_TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'WIB' },
  { value: 'Asia/Makassar', label: 'WITA' },
  { value: 'Asia/Jayapura', label: 'WIT' }
] as const

export type EventTimezone = (typeof EVENT_TIMEZONES)[number]['value']

const TIMEZONE_OFFSETS: Record<EventTimezone, number> = {
  'Asia/Jakarta': 7,
  'Asia/Makassar': 8,
  'Asia/Jayapura': 9
}

const HOUR_MS = 60 * 60 * 1000

export const eventInstantToWallClock = (
  date: Date | string,
  timezone: EventTimezone
): string => {
  const instant = date instanceof Date ? date : new Date(date)
  if (!Number.isFinite(instant.getTime())) return ''

  return new Date(instant.getTime() + TIMEZONE_OFFSETS[timezone] * HOUR_MS)
    .toISOString()
    .slice(0, 16)
}

export const eventWallClockToInstant = (
  value: string,
  timezone: EventTimezone
): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null

  const offset = String(TIMEZONE_OFFSETS[timezone]).padStart(2, '0')
  const instant = new Date(`${value}:00+${offset}:00`)
  // Parsing alone accepts impossible dates such as February 30 by rolling over.
  if (eventInstantToWallClock(instant, timezone) !== value) return null

  return instant
}

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
