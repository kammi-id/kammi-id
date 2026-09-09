import { deriveTahunBulanTerbit } from '~/lib/publikasi/tanggal-terbit'

export { buildPaginationItems } from '~/lib/utils/pagination'

/**
 * `/berita/<tahun>/<bulan>/<slug>` (ADR 0014), via the centralized
 * Asia/Jakarta year/month helper — same as the Permalink page and the
 * Beranda preview grid (`berita-preview-section/utils.ts`), so a card here
 * and the page it links to never disagree on what "kanonik" means.
 */
export const beritaArsipPermalinkPath = (item: {
  slug: string
  publishedAt: Date
}): string => {
  const { tahun, bulan } = deriveTahunBulanTerbit(item.publishedAt)
  return `/berita/${tahun}/${String(bulan).padStart(2, '0')}/${item.slug}`
}

/**
 * Page 1 stays at the bare `/berita` — no `?page=1` noise in the address bar
 * or in whatever crawls this archive. Anything below 1 (a stray `?page=0` or
 * a negative number someone hand-typed) clamps to the same bare path.
 */
export const beritaArsipPageHref = (page: number): string =>
  page <= 1 ? '/berita' : `/berita?page=${page}`
