import { instantToWallClock, wallClockToInstant } from './timezone'

/**
 * ADR 0032: published_at is a real instant (timestamptz). Public dates and
 * permalink year/month stay in Asia/Jakarta, as required by ADR 0014.
 * The shifted Date is only used to read WIB calendar digits, never stored.
 */
const wibCalendar = (instant: Date): Date =>
  new Date(instant.getTime() + 7 * 3_600_000)

export const deriveTahunBulanTerbit = (
  publishedAt: Date
): { tahun: number; bulan: number } => {
  const calendar = wibCalendar(publishedAt)
  return { tahun: calendar.getUTCFullYear(), bulan: calendar.getUTCMonth() + 1 }
}

export const isTerbit = (
  publishedAt: Date | null,
  now: Date = new Date()
): boolean => publishedAt !== null && publishedAt.getTime() <= now.getTime()

export const wibWallClockToPublishedAt = (value: string): Date | null =>
  wallClockToInstant(value, 'Asia/Jakarta')

export const publishedAtToWibWallClock = (publishedAt: Date): string =>
  instantToWallClock(publishedAt, 'Asia/Jakarta')

export const formatTanggalTerbit = (publishedAt: Date): string =>
  new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(publishedAt)

export const toWibIsoString = (publishedAt: Date): string =>
  `${wibCalendar(publishedAt).toISOString().slice(0, 19)}+07:00`

/** A draft's original write time must not predate its public publication. */
export const resolveDateModified = (
  updatedAt: Date,
  publishedAt: Date
): Date =>
  updatedAt.getTime() < publishedAt.getTime() ? publishedAt : updatedAt
