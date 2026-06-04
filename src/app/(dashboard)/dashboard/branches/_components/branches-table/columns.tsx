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
  logo?: string | null
  isNonActive?: boolean
  childrenCount?: number
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
        return (
          <div className='text-foreground -ml-2 h-8 px-2 font-semibold'>
            {org.name}
          </div>
        )
      }
      return (
        <Link
          href={`${basePath}/${org.slug}`}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'text-foreground -ml-2 h-8 px-2 font-semibold'
          )}
        >
          {org.name}
        </Link>
      )
    }
  },
  {
    accessorKey: 'type',
    header: () => (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className='cursor-help'>Tipe</span>
          </TooltipTrigger>
          <TooltipContent>Tipe Organisasi (PW, PD, PK, etc.)</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ),
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
        pw: 'border-primary text-primary bg-primary/10',
        pd: '[border-color:var(--org-pd-border)] [color:var(--org-pd-text)] [background:var(--org-pd-bg)]',
        pdln: '[border-color:var(--org-pd-border)] [color:var(--org-pd-text)] [background:var(--org-pd-bg)]',
        pk: '[border-color:var(--org-pk-border)] [color:var(--org-pk-text)] [background:var(--org-pk-bg)]',
        pp: '[border-color:var(--org-pp-border)] [color:var(--org-pp-text)] [background:var(--org-pp-bg)]'
      }
      return (
        <Badge
          variant='outline'
          className={cn(
            'font-bold',
            colors[type] ||
              '[border-color:var(--org-pp-border)] [color:var(--org-pp-text)] [background:var(--org-pp-bg)]'
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
                  className='size-8 p-0'
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
