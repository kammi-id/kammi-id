import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '~/components/shadcn/ui/pagination'
import { beritaArsipPageHref, buildPaginationItems } from './utils'

type BeritaArchivePaginationProps = {
  currentPage: number
  totalPages: number
}

/**
 * Plain `<a href>` page links (via shadcn's `PaginationLink`, no client JS
 * needed) — a full navigation per page is the right tradeoff for a content
 * archive: crawlable, works with JS disabled, and never desyncs from the
 * server-computed `totalPages` the way a client-side pager could.
 */
export const BeritaArchivePagination = ({
  currentPage,
  totalPages
}: BeritaArchivePaginationProps) => {
  const items = buildPaginationItems(currentPage, totalPages)
  const isFirst = currentPage <= 1
  const isLast = currentPage >= totalPages

  return (
    <Pagination className='mt-12'>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={beritaArsipPageHref(Math.max(1, currentPage - 1))}
            aria-disabled={isFirst}
            tabIndex={isFirst ? -1 : undefined}
            className={isFirst ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>

        {items.map((item, idx) =>
          item === 'ellipsis' ? (
            <PaginationItem key={`ellipsis-${idx}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href={beritaArsipPageHref(item)}
                isActive={item === currentPage}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href={beritaArsipPageHref(Math.min(totalPages, currentPage + 1))}
            aria-disabled={isLast}
            tabIndex={isLast ? -1 : undefined}
            className={isLast ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
