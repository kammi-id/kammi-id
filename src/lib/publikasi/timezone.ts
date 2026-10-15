/** Indonesian zones shared by publication scheduling and Event times. */
export const INDONESIAN_TIMEZONES = [
  { value: 'Asia/Jakarta', label: 'WIB', offset: 7 },
  { value: 'Asia/Makassar', label: 'WITA', offset: 8 },
  { value: 'Asia/Jayapura', label: 'WIT', offset: 9 }
] as const

export type IndonesianTimezone = (typeof INDONESIAN_TIMEZONES)[number]['value']

export const instantToWallClock = (
  date: Date | string,
  timezone: IndonesianTimezone
): string => {
  const instant = date instanceof Date ? date : new Date(date)
  if (!Number.isFinite(instant.getTime())) return ''
  const offset = INDONESIAN_TIMEZONES.find(
    (zone) => zone.value === timezone
  )!.offset
  return new Date(instant.getTime() + offset * 3_600_000)
    .toISOString()
    .slice(0, 16)
}

export const wallClockToInstant = (
  value: string,
  timezone: IndonesianTimezone
): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const offset = INDONESIAN_TIMEZONES.find(
    (zone) => zone.value === timezone
  )!.offset
  const instant = new Date(`${value}:00+${String(offset).padStart(2, '0')}:00`)
  // Date parsing otherwise silently accepts impossible dates by rolling over.
  return instantToWallClock(instant, timezone) === value ? instant : null
}

/** Prefer the browser zone; equivalent UTC+7/8/9 zones map to WIB/WITA/WIT. */
export const detectPublicationTimezone = (
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now = new Date()
): IndonesianTimezone => {
  const offsetName = new Intl.DateTimeFormat('en', {
    timeZone: timezone,
    timeZoneName: 'shortOffset'
  })
    .formatToParts(now)
    .find((part) => part.type === 'timeZoneName')?.value
  return (
    INDONESIAN_TIMEZONES.find((zone) => offsetName === `GMT+${zone.offset}`)
      ?.value ?? 'Asia/Jakarta'
  )
}
