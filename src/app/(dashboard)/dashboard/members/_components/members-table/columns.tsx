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
  {
    accessorKey: 'ab1',
    header: 'AB1',
    cell: ({ row }) => (
      <div className='text-center font-medium'>{row.original.ab1}</div>
    )
  },
  {
    accessorKey: 'ab2',
    header: 'AB2',
    cell: ({ row }) => (
      <div className='text-center font-medium'>{row.original.ab2}</div>
    )
  },
  {
    accessorKey: 'ab3',
    header: 'AB3',
    cell: ({ row }) => (
      <div className='text-center font-medium'>{row.original.ab3}</div>
    )
  },
  {
    accessorKey: 'ikhwan',
    header: 'Ikhwan',
    cell: ({ row }) => (
      <div className='text-center font-medium'>{row.original.ikhwan}</div>
    )
  },
  {
    accessorKey: 'akhwat',
    header: 'Akhwat',
    cell: ({ row }) => (
      <div className='text-center font-medium'>{row.original.akhwat}</div>
    )
  },
  {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => (
      <div className='text-center font-bold'>{row.original.total}</div>
    )
  }
]
