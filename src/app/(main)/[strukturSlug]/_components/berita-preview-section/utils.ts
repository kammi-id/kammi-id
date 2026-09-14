import { deriveTahunBulanTerbit } from '~/lib/publikasi/tanggal-terbit'

/**
 * `/berita/<tahun>/<bulan>/<slug>` (ADR 0014), via the centralized
 * Asia/Jakarta year/month helper — the same one the Permalink page and its
 * canonical-redirect logic use, so this card grid and the page it links to
 * never disagree on what "kanonik" means.
 */
export const beritaPermalinkPath = (item: {
  slug: string
  publishedAt: Date
}): string => {
  const { tahun, bulan } = deriveTahunBulanTerbit(item.publishedAt)
  return `/berita/${tahun}/${String(bulan).padStart(2, '0')}/${item.slug}`
}
