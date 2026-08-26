/**
 * `/berita/<tahun>/<bulan>/<slug>` (ADR 0014). `publishedAt` is a `timestamp`
 * column with no time zone that stores Jakarta wall-clock digits directly
 * (spec "Permalink dan riwayat alamat"), so reading its **UTC** fields
 * returns the correct Jakarta year/month with no arithmetic —
 * `getFullYear()`/`getMonth()` would instead apply the server process's own
 * local timezone, which is the exact "pukul 06.00 WIB terlempar ke Desember
 * tahun sebelumnya" bug ADR 0014 warns about.
 *
 * This is a minimal, self-contained stand-in for this card grid only —
 * ticket 05 owns the canonical, centralized Asia/Jakarta year/month helper
 * used by both the write and read paths.
 */
export const beritaPermalinkPath = (item: {
  slug: string
  publishedAt: Date
}): string => {
  const tahun = item.publishedAt.getUTCFullYear()
  const bulan = String(item.publishedAt.getUTCMonth() + 1).padStart(2, '0')
  return `/berita/${tahun}/${bulan}/${item.slug}`
}
