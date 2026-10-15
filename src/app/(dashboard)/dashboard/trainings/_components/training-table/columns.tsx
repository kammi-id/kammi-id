'use client'

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Badge } from '~/components/shadcn/ui/badge'
import { cn } from '~/lib/shadcn/utils'
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
  dm1: 'bg-primary/10 text-primary border-primary/20',
  dm2: 'bg-primary/10 text-primary border-primary/20',
  dpmk: 'bg-primary/10 text-primary border-primary/20',
  tfi: 'bg-primary/10 text-primary border-primary/20',
  dm3: 'bg-primary/10 text-primary border-primary/20',
  other: 'bg-slate-100 text-slate-700 border-slate-200'
}

export const getColumns = (): ColumnDef<Training>[] => [
  {
    accessorKey: 'name',
    header: 'Nama Daurah',
    cell: ({ row }) => {
      const training = row.original
      const orgSlug = training.organization.slug
      const fullId = `${training.year}${String(training.identifier).padStart(3, '0')}`
      return (
        <Link
          href={`/dashboard/trainings/${orgSlug}/${fullId}`}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'text-foreground -ml-2 h-8 px-2 font-medium'
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
    cell: ({ row }) => (
      <div className='-ml-2 h-8 px-2'>{row.original.organization.name}</div>
    )
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
    accessorKey: 'startDate',
    header: 'Tanggal',
    cell: ({ row }) => {
      const { startDate, endDate } = row.original
      const start = new Date(startDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
      const end = new Date(endDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
      return (
        <div className='-ml-2 h-8 px-2 text-xs'>
          {start} - {end}
        </div>
      )
    }
  }
]
