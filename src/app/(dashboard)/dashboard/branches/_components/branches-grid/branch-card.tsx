'use client'

import { Organization } from '../branches-table/columns'
import { Button } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Edit01Icon, ChevronRight } from '@hugeicons/core-free-icons'
import Link from 'next/link'
import { cn } from '~/lib/shadcn/utils'
import { Badge } from '~/components/shadcn/ui/badge'

interface BranchCardProps {
  org: Organization
  basePath: string
  onEdit: (org: Organization) => void
}

export const BranchCard = ({ org, basePath, onEdit }: BranchCardProps) => {
  const labels: Record<string, string> = {
    pw: 'Wilayah',
    pd: 'Daerah',
    pdln: 'Daerah LN',
    pk: 'Komisariat',
    pp: 'Pusat'
  }
  const colors: Record<string, string> = {
    pw: 'border-primary text-primary bg-primary/5',
    pd: 'border-blue-200 text-blue-600 bg-blue-50/50',
    pdln: 'border-blue-200 text-blue-600 bg-blue-50/50',
    pk: 'border-red-200 text-red-600 bg-red-50/50',
    pp: 'border-slate-200 text-slate-600 bg-slate-50/50'
  }

  return (
    <div className='group border-border bg-card hover:border-primary/50 relative flex flex-col justify-between rounded-lg border p-5 transition-all hover:shadow-sm'>
      <div className='space-y-4'>
        <div className='flex items-start justify-between gap-2'>
          <Badge
            variant='outline'
            className={cn(
              'text-[10px] font-bold tracking-wider uppercase',
              colors[org.type] || 'border-slate-200 bg-slate-100 text-slate-700'
            )}
          >
            {labels[org.type] || org.type}
          </Badge>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 w-8 p-0 opacity-30 transition-opacity group-hover:opacity-100 focus-visible:opacity-100'
            onClick={() => onEdit(org)}
          >
            <HugeiconsIcon
              icon={Edit01Icon}
              strokeWidth={2}
              className='text-muted-foreground size-4'
            />
          </Button>
        </div>
        <div>
          <Link
            href={`${basePath}/${org.slug}`}
            className='group/link flex items-center justify-between gap-1'
          >
            <span className='text-foreground group-hover/link:text-primary font-semibold transition-colors'>
              {org.name}
            </span>
            <HugeiconsIcon
              icon={ChevronRight}
              strokeWidth={2}
              className='text-muted-foreground size-4 transition-transform group-hover/link:translate-x-1'
            />
          </Link>
        </div>
      </div>
      <div className='border-border/50 mt-6 flex items-center justify-between border-t pt-4'>
        <div className='flex flex-col'>
          <span className='text-muted-foreground text-[10px] font-medium tracking-tight uppercase'>
            Kode
          </span>
          <span className='text-foreground font-mono text-xs'>{org.code}</span>
        </div>
        {org.childrenCount !== undefined && org.childrenCount > 0 && (
          <div className='flex flex-col text-right'>
            <span className='text-muted-foreground text-[10px] font-medium tracking-tight uppercase'>
              Sub-struktur
            </span>
            <span className='text-foreground text-xs'>{org.childrenCount}</span>
          </div>
        )}
      </div>
    </div>
  )
}
