'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Link01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { Badge } from '~/components/shadcn/ui/badge'
import { cn } from '~/lib/shadcn/utils'
import { buttonVariants } from '~/components/shadcn/ui/button'

export interface MemberOrganization {
  organizationId: string
  name: string
  type: string
  slug: string
  ab1: number
  ab2: number
  ab3: number
  ikhwan: number
  akhwat: number
  total: number
}

export const getColumns = (
  nameHeader: string,
  basePath: string,
  type?: string
): ColumnDef<MemberOrganization>[] => [
  {
    accessorKey: 'name',
    header: nameHeader,
    cell: ({ row }) => {
      const org = row.original
      const href = `${basePath}/${org.slug}`
      return (
        <Link
          href={href}
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
  ...['ab1', 'ab2', 'ab3', 'ikhwan', 'akhwat'].map((key) => ({
    accessorKey: key,
    header: key.toUpperCase(),
    cell: ({ row }) => {
      const value = row.original[key as keyof MemberOrganization] as number
      const total = row.original.total
      const percentage = total > 0 ? (value / total) * 100 : 0
      return (
        <div className='bg-muted/30 relative flex h-8 w-full items-center justify-center overflow-hidden rounded-sm px-2'>
          <div
            className={cn(
              'absolute top-0 left-0 h-full transition-all duration-500',
              key === 'ab3'
                ? 'bg-green-500/20'
                : key === 'ab2'
                  ? 'bg-red-500/20'
                  : key === 'ab1'
                    ? 'bg-blue-500/20'
                    : 'bg-primary/10'
            )}
            style={{ width: `${percentage}%` }}
          />
          <span className='relative z-10 text-center font-medium'>{value}</span>
        </div>
      )
    }
  })),
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => (
      <div className='text-center font-bold'>{row.original.total}</div>
    )
  }
]
