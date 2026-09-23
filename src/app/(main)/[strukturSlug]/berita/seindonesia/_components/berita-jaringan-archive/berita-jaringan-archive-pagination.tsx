import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '~/components/shadcn/ui/pagination'
import { beritaJaringanPageHref, buildPaginationItems } from './utils'

type BeritaJaringanArchivePaginationProps = {
  currentPage: number
  totalPages: number
}

/**
 * Plain `<a href>` page links, same rationale as `BeritaArchivePagination`
 * (`berita-archive/berita-archive-pagination.tsx`): crawlable, no client JS,
 * never desyncs from the server-computed `totalPages`.
 */
export const BeritaJaringanArchivePagination = ({
  currentPage,
  totalPages
}: BeritaJaringanArchivePaginationProps) => {
  const items = buildPaginationItems(currentPage, totalPages)
  const isFirst = currentPage <= 1
  const isLast = currentPage >= totalPages

  return (
    <Pagination className='mt-12'>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={beritaJaringanPageHref(Math.max(1, currentPage - 1))}
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
                href={beritaJaringanPageHref(item)}
                isActive={item === currentPage}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        <PaginationItem>
          <PaginationNext
            href={beritaJaringanPageHref(Math.min(totalPages, currentPage + 1))}
            aria-disabled={isLast}
            tabIndex={isLast ? -1 : undefined}
            className={isLast ? 'pointer-events-none opacity-50' : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
