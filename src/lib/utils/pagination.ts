/**
 * Windowed page-number list for a pagination nav: first page, last page, and
 * a `siblingCount`-wide window around `current`, collapsing the gaps into a
 * single `'ellipsis'` marker on each side. Below the threshold where a
 * window would actually save space, every page number is shown plainly
 * instead.
 *
 * Shared by every Berita archive's pagination component
 * (`berita-archive`, `berita-jaringan-archive`) — path-agnostic and
 * domain-free, so it lives here rather than duplicated per archive folder.
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
