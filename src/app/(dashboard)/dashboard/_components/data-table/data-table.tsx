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
import { Badge } from '~/components/shadcn/ui/badge'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { cn } from '~/lib/shadcn/utils'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft02Icon,
  FilterIcon,
  SortByUp01Icon,
  SortByDown01Icon
} from '@hugeicons/core-free-icons'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  placeholder?: string
  pageCount?: number
  totalCount?: number
  actionElement?: React.ReactNode
  queryPrefix?: string
  onRowClick?: (data: TData) => void
  footerRows?: React.ReactNode
  filterKeys?: string[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  placeholder,
  pageCount = -1,
  totalCount = 0,
  actionElement,
  queryPrefix = '',
  onRowClick,
  footerRows,
  filterKeys = []
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const qKey = `${queryPrefix}q`
  const pageKey = `${queryPrefix}page`
  const sizeKey = `${queryPrefix}size`
  const sortKey = `${queryPrefix}sort`

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

  const clearFilters = React.useCallback(() => {
    const updates: Record<string, string | null> = {
      [qKey]: null,
      [pageKey]: '1'
    }
    filterKeys.forEach((key) => {
      updates[key] = null
    })
    updateURL(updates)
  }, [updateURL, qKey, pageKey, filterKeys])

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

  const [searchValue, setSearchValue] = React.useState(
    searchParams.get(qKey) || ''
  )
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== (searchParams.get(qKey) || '')) {
        updateURL({ [qKey]: searchValue || null, [pageKey]: '1' })
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchValue, updateURL, searchParams, qKey, pageKey])

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex flex-1 items-center gap-3'>
          {searchKey && (
            <div className='relative w-full max-w-sm'>
              <Input
                placeholder={placeholder ?? `Cari ${searchKey}...`}
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
          <div className='flex items-center gap-2 overflow-x-auto pb-1'>
            {filterKeys.map((key) => {
              const value = searchParams.get(key)
              if (!value) return null
              return (
                <Badge
                  key={key}
                  variant='secondary'
                  className='hover:bg-destructive/10 hover:text-destructive flex items-center gap-1 px-2 py-0.5 text-xs font-medium transition-colors'
                  onClick={() => updateURL({ [key]: null, [pageKey]: '1' })}
                >
                  {key === 'status'
                    ? 'Jenjang'
                    : key === 'gender'
                      ? 'Jenis Kelamin'
                      : key}
                  : {value}
                  <HugeiconsIcon icon={FilterIcon} className='size-3' />
                </Badge>
              )
            })}
            {(filterKeys.some((key) => searchParams.has(key)) ||
              searchParams.get(qKey)) && (
              <Button
                variant='ghost'
                size='sm'
                className='text-muted-foreground hover:text-foreground h-8 px-2 text-xs font-medium'
                onClick={clearFilters}
              >
                Hapus Semua
              </Button>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2'>{actionElement}</div>
      </div>
      <div
        className={cn(
          'bg-card overflow-hidden rounded-xl border shadow-xs',
          pathname.includes('/perangkat') && 'border-transparent'
        )}
      >
        <Table>
          <TableHeader className='bg-muted/50'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='hover:bg-transparent'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className='text-muted-foreground h-10 text-xs font-bold tracking-wider uppercase'
                  >
                    {header.isPlaceholder ? null : (
                      <div className='flex items-center gap-1'>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() === 'asc' && (
                          <HugeiconsIcon
                            icon={SortByUp01Icon}
                            className='text-primary size-3'
                          />
                        )}
                        {header.column.getIsSorted() === 'desc' && (
                          <HugeiconsIcon
                            icon={SortByDown01Icon}
                            className='text-primary size-3'
                          />
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              <>
                {table.getRowModel().rows.map((row) => (
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
                ))}
              </>
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
            {footerRows}
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
