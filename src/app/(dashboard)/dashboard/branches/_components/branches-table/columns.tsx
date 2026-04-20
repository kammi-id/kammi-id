'use client'

import { ColumnDef } from '@tanstack/react-table'
import { ChevronRight, Edit01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { Badge } from '~/components/shadcn/ui/badge'
import { Button } from '~/components/shadcn/ui/button'
import { cn } from '~/lib/shadcn/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '~/components/shadcn/ui/tooltip'
import { buttonVariants } from '~/components/shadcn/ui/button'

export interface Organization {
  id: string
  name: string
  code: string
  slug: string
  type: string
  level: number
  parentId: string | null
}

export const getColumns = (
  nameHeader: string,
  basePath: string,
  onEdit?: (org: Organization) => void
): ColumnDef<Organization>[] => [
  {
    accessorKey: 'name',
    header: nameHeader,
    cell: ({ row }) => {
      const org = row.original
      if (org.type === 'pk') {
        return <div className='-ml-2 h-8 px-2 font-medium'>{org.name}</div>
      }
      return (
        <Link
          href={`${basePath}/${org.slug}`}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ml-2 h-8 px-2 font-medium'
          )}
        >
          {org.name}
        </Link>
      )
    }
  },
  {
    accessorKey: 'type',
    header: 'Tipe',
    cell: ({ row }) => {
      const type = row.original.type
      const labels: Record<string, string> = {
        pw: 'Wilayah',
        pd: 'Daerah',
        pdln: 'Daerah LN',
        pk: 'Komisariat',
        pp: 'Pusat'
      }
      const colors: Record<string, string> = {
        pw: 'bg-green-100 text-green-700 border-green-200',
        pd: 'bg-blue-100 text-blue-700 border-blue-200',
        pdln: 'bg-blue-100 text-blue-700 border-blue-200',
        pk: 'bg-red-100 text-red-700 border-red-200',
        pp: 'bg-slate-100 text-slate-700 border-slate-200'
      }
      return (
        <Badge
          variant='outline'
          className={cn(
            'font-bold',
            colors[type] || 'border-slate-200 bg-slate-100 text-slate-700'
          )}
        >
          {(labels[type] || type).toUpperCase()}
        </Badge>
      )
    }
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Aksi</div>,
    cell: ({ row }) => (
      <div className='text-right'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 w-8 p-0'
                  onClick={() => onEdit?.(row.original)}
                >
                  <HugeiconsIcon
                    icon={Edit01Icon}
                    strokeWidth={2}
                    className='size-4'
                  />
                </Button>
              }
            >
              Edit {row.original.name}
            </TooltipTrigger>
            <TooltipContent>Edit {row.original.name}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }
]
