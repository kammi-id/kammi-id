'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ChevronRight } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { Badge } from '~/components/shadcn/ui/badge'
import { buttonVariants } from '~/components/shadcn/ui/button'
import { cn } from '~/lib/shadcn/utils'

export interface Organization {
  id: string
  name: string
  slug: string
  type: string
  level: number
  parentId: string | null
}

export const getColumns = (nameHeader: string): ColumnDef<Organization>[] => [
  {
    accessorKey: 'name',
    header: nameHeader,
    cell: ({ row }) => (
      <Link
        href={`/dashboard/regions/${row.original.slug}`}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          '-ml-2 h-8 px-2 font-medium'
        )}
      >
        {row.original.name}
      </Link>
    )
  },
  {
    accessorKey: 'type',
    header: 'Tipe',
    cell: ({ row }) => (
      <Badge variant='outline' className='capitalize'>
        {row.original.type}
      </Badge>
    )
  },
  {
    accessorKey: 'level',
    header: 'Level',
    cell: ({ row }) => `Level ${row.original.level}`
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Aksi</div>,
    cell: ({ row }) => (
      <div className='text-right'>
        <Link
          href={`/dashboard/regions/${row.original.slug}`}
          className='text-primary inline-flex items-center gap-1 text-sm hover:underline'
        >
          Detail{' '}
          <HugeiconsIcon
            icon={ChevronRight}
            strokeWidth={2}
            className='size-3'
          />
        </Link>
      </div>
    )
  }
]
