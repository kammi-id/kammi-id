import { deriveTahunBulanTerbit } from '~/lib/publikasi/tanggal-terbit'

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

/**
 * Windowed page-number list for the archive's pagination nav: first page,
 * last page, and a `siblingCount`-wide window around `current`, collapsing
 * the gaps into a single `'ellipsis'` marker on each side. Below the
 * threshold where a window would actually save space, every page number is
 * shown plainly instead.
 */
export const buildPaginationItems = (
  current: number,
  total: number,
  siblingCount = 1
): (number | 'ellipsis')[] => {
  if (total <= 0) return []

  // 1 (first) + 1 (last) + current + siblingCount on each side + 2 possible
  // ellipses — below this, showing every page plainly is already compact.
  const totalPageNumbersWithoutEllipsis = siblingCount * 2 + 5
  if (total <= totalPageNumbersWithoutEllipsis) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const leftSiblingIndex = Math.max(current - siblingCount, 1)
  const rightSiblingIndex = Math.min(current + siblingCount, total)

  const showLeftEllipsis = leftSiblingIndex > 2
  const showRightEllipsis = rightSiblingIndex < total - 1

  const items: (number | 'ellipsis')[] = [1]

  if (showLeftEllipsis) {
    items.push('ellipsis')
  } else {
    for (let page = 2; page < leftSiblingIndex; page++) items.push(page)
  }

  for (let page = leftSiblingIndex; page <= rightSiblingIndex; page++) {
    if (page !== 1 && page !== total) items.push(page)
  }

  if (showRightEllipsis) {
    items.push('ellipsis')
  } else {
    for (let page = rightSiblingIndex + 1; page < total; page++)
      items.push(page)
  }

  items.push(total)

  return items
}
