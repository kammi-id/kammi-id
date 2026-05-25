'use client'

import { type ColumnDef, type CellContext } from '@tanstack/react-table'
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
        pw: '[background:var(--org-pw-bg)] [color:var(--org-pw-text)] [border-color:var(--org-pw-border)]',
        pd: '[background:var(--org-pd-bg)] [color:var(--org-pd-text)] [border-color:var(--org-pd-border)]',
        pdln: '[background:var(--org-pd-bg)] [color:var(--org-pd-text)] [border-color:var(--org-pd-border)]',
        pk: '[background:var(--org-pk-bg)] [color:var(--org-pk-text)] [border-color:var(--org-pk-border)]',
        pp: '[background:var(--org-pp-bg)] [color:var(--org-pp-text)] [border-color:var(--org-pp-border)]'
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
  ...['ab1', 'ab2', 'ab3', 'ikhwan', 'akhwat'].map((key) => ({
    accessorKey: key,
    header: key.toUpperCase(),
    cell: ({ row }: CellContext<MemberOrganization, unknown>) => {
      const value = row.original[key as keyof MemberOrganization] as number
      const total = row.original.total
      const percentage = total > 0 ? (value / total) * 100 : 0
      return (
        <div className='bg-muted/30 relative flex h-8 w-full items-center justify-center overflow-hidden rounded-sm px-2'>
          <div
            className={cn(
              'absolute top-0 left-0 h-full transition-all duration-500',
              key === 'ab3'
                ? 'bg-primary/15'
                : key === 'ab2'
                  ? 'bg-primary/25'
                  : key === 'ab1'
                    ? 'bg-primary/35'
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
