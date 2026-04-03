'use client'

import {
  type JSX,
  type ComponentProps,
  type CSSProperties,
  useState
} from 'react'
import {
  Table as TableRoot,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/shadcn/ui/table'
import Empty from './empty'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Header,
  type ColumnSizingState,
  type VisibilityState
} from '@tanstack/react-table'
import { cn } from '~/lib/shadcn/utils'

type TableProps<TData, TValue> = {
  columns: Array<ColumnDef<TData, TValue>>
  data: Array<TData>
  columnVisibility?: VisibilityState
} & ComponentProps<'div'>

const Table = <TData, TValue>({
  columns,
  data,
  columnVisibility: defaultColumnVisibility = {},
  children,
  className,
  ...props
}: TableProps<TData, TValue>): JSX.Element => {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    defaultColumnVisibility
  )
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  const table = useReactTable({
    columns,
    data,
    state: {
      columnVisibility,
      columnSizing
    },
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    enableColumnResizing: true,
    columnResizeMode: 'onChange'
  })

  const getResizeHandlerForColumn = (
    columnId: string
  ): ReturnType<Header<TData, unknown>['getResizeHandler']> | undefined => {
    const headerGroups = table.getHeaderGroups()
    for (const hg of headerGroups) {
      for (const h of hg.headers) {
        if (h.id === columnId) return h.getResizeHandler()
      }
    }
    return undefined
  }

  return (
    <div
      className={cn('overflow-hidden rounded-md border', className)}
      {...props}
    >
      <TableRoot>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  className='relative w-(--th-size)'
                  key={header.id}
                  colSpan={header.colSpan}
                  style={
                    {
                      '--th-size': header.getSize() + 'px'
                    } as CSSProperties
                  }
                >
                  {!header.isPlaceholder
                    ? flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    : null}
                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={cn(
                        'bg-border/50 absolute top-0 right-0 h-full w-px cursor-ew-resize touch-none select-none',
                        header.column.getIsResizing() && 'bg-border'
                      )}
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className='relative w-(--td-size) wrap-break-word whitespace-normal'
                    style={
                      {
                        '--td-size': cell.column.getSize() + 'px'
                      } as CSSProperties
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    {cell.column.getCanResize() &&
                      (() => {
                        const resizeHandler = getResizeHandlerForColumn(
                          cell.column.id
                        )
                        return (
                          <div
                            onMouseDown={resizeHandler}
                            onTouchStart={resizeHandler}
                            className={cn(
                              'bg-border/50 absolute top-0 right-0 h-full w-px cursor-ew-resize touch-none select-none',
                              cell.column.getIsResizing() && 'bg-border'
                            )}
                          />
                        )
                      })()}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className='w-(--td-size)'
                style={
                  {
                    '--td-size': table.getCenterTotalSize() + 'px'
                  } as CSSProperties
                }
              >
                {children ?? (
                  <Empty className='h-[50vh] text-center'>
                    <div>Belum ada data.</div>
                  </Empty>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableRoot>
    </div>
  )
}

export default Table
