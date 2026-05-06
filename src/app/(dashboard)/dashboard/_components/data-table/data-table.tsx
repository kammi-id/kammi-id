'use client'

import * as React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/shadcn/ui/table'
import { Button, buttonVariants } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { cn } from '~/lib/shadcn/utils'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  pageCount?: number
  totalCount?: number
  actionElement?: React.ReactNode
  queryPrefix?: string
  onRowClick?: (data: TData) => void
}

/**
 * DataTable component is a generic, high-performance table used for displaying
 * and managing lists of data.
 *
 * It integrates with @tanstack/react-table for core logic and uses URL search
 * parameters as the single source of truth for sorting, filtering, and pagination,
 * ensuring that table state is shareable and persistent across refreshes.
 *
 * @template TData The type of data for each row.
 * @template TValue The type of value in the columns.
 * @param props - The properties for the DataTable component.
 * @param props.columns - Column definitions for the table.
 * @param props.data - The array of data to be displayed.
 * @param props.searchKey - The key used for filtering/searching the data.
 * @param props.pageCount - Total number of pages available.
 * @param props.totalCount - Total number of items in the dataset.
 * @param props.actionElement - Optional React element to render in the top-right action area.
 * @param props.queryPrefix - Prefix for the URL search parameters to avoid conflicts.
 * @param props.onRowClick - Optional callback triggered when a row is clicked.
 * @returns A React element rendering the data table with pagination and search.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  pageCount = -1,
  totalCount = 0,
  actionElement,
  queryPrefix = '',
  onRowClick
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const qKey = `${queryPrefix}q`
  const pageKey = `${queryPrefix}page`
  const sizeKey = `${queryPrefix}size`
  const sortKey = `${queryPrefix}sort`

  // Derived state from URL (Single Source of Truth)
  const sorting = React.useMemo(() => {
    const sort = searchParams.get(sortKey)
    if (!sort) return []
    const [id, desc] = sort.split('.')
    return [{ id, desc: desc === 'desc' }]
  }, [searchParams, sortKey])

  const columnFilters = React.useMemo(() => {
    const filters: ColumnFiltersState = []
    if (searchKey) {
      const q = searchParams.get(qKey)
      if (q) filters.push({ id: searchKey, value: q })
    }
    return filters
  }, [searchParams, searchKey, qKey])

  const pagination = React.useMemo(() => {
    const page = searchParams.get(pageKey)
    const size = searchParams.get(sizeKey)
    return {
      pageIndex: page ? Math.max(0, parseInt(page) - 1) : 0,
      pageSize: size ? parseInt(size) : 10
    }
  }, [searchParams, pageKey, sizeKey])

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Helper to update URL (used for search/replace navigation)
  const updateURL = React.useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) params.delete(key)
        else params.set(key, value)
      })
      const query = params.toString()
      router.replace(`${pathname}${query ? `?${query}` : ''}`, {
        scroll: false
      })
    },
    [pathname, router, searchParams]
  )

  // Helper to create page URL for Next Link
  const getPageURL = React.useCallback(
    (pageIndex: number) => {
      const params = new URLSearchParams(searchParams.toString())
      if (pageIndex > 0) params.set(pageKey, (pageIndex + 1).toString())
      else params.delete(pageKey)

      const query = params.toString()
      return `${pathname}${query ? `?${query}` : ''}`
    },
    [pathname, searchParams, pageKey]
  )

  const table = useReactTable({
    data: data ?? [],
    columns: columns ?? [],
    pageCount,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination
    },

    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    // Handlers update URL instead of local state
    onSortingChange: (updaterOrValue) => {
      const newSorting =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(sorting)
          : updaterOrValue
      if (newSorting.length > 0) {
        const { id, desc } = newSorting[0]
        updateURL({ [sortKey]: `${id}.${desc ? 'desc' : 'asc'}` })
      } else {
        updateURL({ [sortKey]: null })
      }
    },
    onPaginationChange: (updaterOrValue) => {
      const newPagination =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(pagination)
          : updaterOrValue
      updateURL({
        [pageKey]: (newPagination.pageIndex + 1).toString(),
        [sizeKey]: newPagination.pageSize.toString()
      })
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true
  })

  // Debounced search
  const [searchValue, setSearchValue] = React.useState(
    searchParams.get(qKey) || ''
  )
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== (searchParams.get(qKey) || '')) {
        updateURL({ [qKey]: searchValue || null, [pageKey]: '1' }) // Reset to page 1 on search
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchValue, updateURL, searchParams, qKey, pageKey])

  const isSubPage = pathname.split('/').filter(Boolean).length > 2
  const parentPath = pathname.split('/').slice(0, -1).join('/')

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex flex-1 items-center gap-2'>
          {searchKey && (
            <div className='relative w-full max-w-sm'>
              <Input
                placeholder={`Cari ${searchKey}...`}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className='h-9 pl-9'
              />
              <div className='text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2'>
                <HugeiconsIcon
                  icon={ArrowLeft02Icon}
                  className='size-4 rotate-180'
                />
              </div>
            </div>
          )}
        </div>
        <div className='flex items-center gap-2'>{actionElement}</div>
      </div>
      <div className='bg-card overflow-hidden rounded-xl border shadow-xs'>
        <Table>
          <TableHeader className='bg-muted/50'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className='text-muted-foreground h-10 text-xs font-bold tracking-wider uppercase'
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    'transition-colors',
                    onRowClick && 'hover:bg-muted/50 cursor-pointer'
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className='py-3'>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='text-muted-foreground h-32 text-center'
                >
                  Tidak ada hasil.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-between px-1'>
        <div className='text-muted-foreground text-xs'>
          {table.getFilteredSelectedRowModel().rows.length} dari{' '}
          {totalCount > 0 ? totalCount : data.length} baris terpilih.
          {totalCount > 0 && (
            <span className='ml-2 opacity-70'>
              (Menampilkan {pagination.pageIndex * pagination.pageSize + 1}-
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                totalCount
              )}{' '}
              data)
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <Link
            href={getPageURL(pagination.pageIndex - 1)}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 px-3 text-xs font-medium',
              !table.getCanPreviousPage() && 'pointer-events-none opacity-50'
            )}
            aria-disabled={!table.getCanPreviousPage()}
            tabIndex={!table.getCanPreviousPage() ? -1 : undefined}
          >
            Sebelumnya
          </Link>
          <div className='text-muted-foreground flex items-center gap-1 text-xs font-medium'>
            Halaman {pagination.pageIndex + 1}
            {pageCount > 0 && ` dari ${pageCount}`}
          </div>
          <Link
            href={getPageURL(pagination.pageIndex + 1)}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 px-3 text-xs font-medium',
              !table.getCanNextPage() && 'pointer-events-none opacity-50'
            )}
            aria-disabled={!table.getCanNextPage()}
            tabIndex={!table.getCanNextPage() ? -1 : undefined}
          >
            Berikutnya
          </Link>
        </div>
      </div>
    </div>
  )
}
