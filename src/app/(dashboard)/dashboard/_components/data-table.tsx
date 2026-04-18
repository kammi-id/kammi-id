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
}

export const DataTable = <TData, TValue>({
  columns,
  data,
  searchKey,
  pageCount = -1,
  totalCount = 0,
  actionElement
}: DataTableProps<TData, TValue>) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Derived state from URL (Single Source of Truth)
  const sorting = React.useMemo(() => {
    const sort = searchParams.get('sort')
    if (!sort) return []
    const [id, desc] = sort.split('.')
    return [{ id, desc: desc === 'desc' }]
  }, [searchParams])

  const columnFilters = React.useMemo(() => {
    const filters: ColumnFiltersState = []
    if (searchKey) {
      const q = searchParams.get('q')
      if (q) filters.push({ id: searchKey, value: q })
    }
    return filters
  }, [searchParams, searchKey])

  const pagination = React.useMemo(() => {
    const page = searchParams.get('page')
    const size = searchParams.get('size')
    return {
      pageIndex: page ? Math.max(0, parseInt(page) - 1) : 0,
      pageSize: size ? parseInt(size) : 10
    }
  }, [searchParams])

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
      if (pageIndex > 0) params.set('page', (pageIndex + 1).toString())
      else params.delete('page')

      const query = params.toString()
      return `${pathname}${query ? `?${query}` : ''}`
    },
    [pathname, searchParams]
  )

  const table = useReactTable({
    data,
    columns,
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
        updateURL({ sort: `${id}.${desc ? 'desc' : 'asc'}` })
      } else {
        updateURL({ sort: null })
      }
    },
    onPaginationChange: (updaterOrValue) => {
      const newPagination =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(pagination)
          : updaterOrValue
      updateURL({
        page: (newPagination.pageIndex + 1).toString(),
        size: newPagination.pageSize.toString()
      })
    },
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true
  })

  // Debounced search
  const [searchValue, setSearchValue] = React.useState(
    searchParams.get('q') || ''
  )
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== (searchParams.get('q') || '')) {
        updateURL({ q: searchValue || null, page: '1' }) // Reset to page 1 on search
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchValue, updateURL, searchParams])

  const isRegionsSubPage =
    pathname.startsWith('/dashboard/branches/') &&
    pathname !== '/dashboard/branches'
  const parentPath = pathname.split('/').slice(0, -1).join('/')

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-2'>
        <div className='flex flex-1 items-center gap-2'>
          {isRegionsSubPage && (
            <Link
              href={parentPath}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'icon-sm' }),
                'size-8 shrink-0'
              )}
            >
              <HugeiconsIcon
                icon={ArrowLeft02Icon}
                strokeWidth={2}
                className='size-4'
              />
            </Link>
          )}
          {searchKey && (
            <Input
              placeholder={`Cari ${searchKey}...`}
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className='h-8 max-w-sm'
            />
          )}
        </div>
        <div className='flex items-center gap-2'>{actionElement}</div>
      </div>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className='h-24 text-center'
                >
                  Tidak ada hasil.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-between px-2'>
        <div className='text-muted-foreground text-sm'>
          {table.getFilteredSelectedRowModel().rows.length} dari{' '}
          {totalCount > 0 ? totalCount : data.length} baris terpilih.
          {totalCount > 0 && (
            <span className='ml-2 text-xs opacity-70'>
              (Menampilkan {pagination.pageIndex * pagination.pageSize + 1}-
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                totalCount
              )}{' '}
              data)
            </span>
          )}
        </div>
        <div className='flex items-center space-x-2'>
          <Link
            href={getPageURL(pagination.pageIndex - 1)}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 px-2',
              !table.getCanPreviousPage() && 'pointer-events-none opacity-50'
            )}
            aria-disabled={!table.getCanPreviousPage()}
            tabIndex={!table.getCanPreviousPage() ? -1 : undefined}
          >
            Sebelumnya
          </Link>
          <div className='flex items-center gap-1 text-sm font-medium'>
            Halaman {pagination.pageIndex + 1}
            {pageCount > 0 && ` dari ${pageCount}`}
          </div>
          <Link
            href={getPageURL(pagination.pageIndex + 1)}
            className={cn(
              buttonVariants({ variant: 'outline', size: 'sm' }),
              'h-8 px-2',
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
