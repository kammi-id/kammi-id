'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Edit01Icon, Delete01Icon } from '@hugeicons/core-free-icons'
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

export interface Training {
  id: string
  name: string
  startDate: string
  endDate: string
  registrationDeadline?: string | null
  type: 'dm1' | 'dm2' | 'dpmk' | 'tfi' | 'dm3' | 'other'
  year: number
  identifier: number
  organization: {
    id: string
    name: string
    slug: string
  }
}

const typeLabels: Record<string, string> = {
  dm1: 'DM 1',
  dm2: 'DM 2',
  dpmk: 'DPMK',
  tfi: 'TFI',
  dm3: 'DM 3',
  other: 'Lainnya'
}

const typeColors: Record<string, string> = {
  dm1: 'bg-blue-100 text-blue-700 border-blue-200',
  dm2: 'bg-green-100 text-green-700 border-green-200',
  dpmk: 'bg-purple-100 text-purple-700 border-purple-200',
  tfi: 'bg-orange-100 text-orange-700 border-orange-200',
  dm3: 'bg-red-100 text-red-700 border-red-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200'
}

export const getColumns = (
  onEdit?: (training: Training) => void,
  onDelete?: (id: string) => void
): ColumnDef<Training>[] => [
  {
    accessorKey: 'name',
    header: 'Nama Dauroh',
    cell: ({ row }) => {
      const training = row.original
      const orgSlug = training.organization.slug
      return (
        <Link
          href={`/dashboard/trainings/${orgSlug}/${training.year}/${training.identifier}`}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ml-2 h-8 px-2 font-medium text-foreground'
          )}
        >
          {training.name}
        </Link>
      )
    }
  },
  {
    accessorKey: 'organization.name',
    header: 'Organisasi',
    cell: ({ row }) => <div className='-ml-2 h-8 px-2'>{row.original.organization.name}</div>
  },
  {
    accessorKey: 'type',
    header: 'Tipe',
    cell: ({ row }) => {
      const type = row.original.type
      return (
        <Badge
          variant='outline'
          className={cn(
            'font-bold',
            typeColors[type] || 'border-slate-200 bg-slate-100 text-slate-700'
          )}
        >
          {typeLabels[type] || type}
        </Badge>
      )
    }
  },
  {
    id: 'identifier',
    header: 'ID',
    cell: ({ row }) => {
      const { year, identifier } = row.original
      return <div className='-ml-2 h-8 px-2 font-mono text-xs'>{year}-${identifier}</div>
    }
  },
  {
    accessorKey: 'startDate',
    header: 'Tanggal',
    cell: ({ row }) => {
      const { startDate, endDate } = row.original
      const start = new Date(startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      const end = new Date(endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
      return <div className='-ml-2 h-8 px-2 text-xs'>{start} - {end}</div>
    }
  },
  {
    id: 'actions',
    header: () => <div className='text-right'>Aksi</div>,
    cell: ({ row }) => (
      <div className='text-right'>
        <TooltipProvider>
          <div className='flex justify-end gap-1'>
            <Tooltip>
              <TooltipTrigger
                asChild
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
                <span>Edit {row.original.name}</span>
              </TooltipTrigger>
              <TooltipContent>Edit {row.original.name}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                asChild
                render={
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0 text-destructive hover:text-destructive'
                    onClick={() => onDelete?.(row.original.id)}
                  >
                    <HugeiconsIcon
                      icon={Delete01Icon}
                      strokeWidth={2}
                      className='size-4'
                    />
                  </Button>
                }
              >
                <span>Hapus {row.original.name}</span>
              </TooltipTrigger>
              <TooltipContent>Hapus {row.original.name}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    )
  }
]
