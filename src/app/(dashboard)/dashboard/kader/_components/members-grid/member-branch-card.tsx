'use client'

import { type Organization } from '~/app/(dashboard)/dashboard/_data/organizations'
import { Button } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Edit01Icon, ChevronRight } from '@hugeicons/core-free-icons'
import Link from 'next/link'
import { cn } from '~/lib/shadcn/utils'
import { Badge } from '~/components/shadcn/ui/badge'

interface MemberBranchCardProps {
  org: Organization & {
    ab1: number
    ab2: number
    ab3: number
    ikhwan: number
    akhwat: number
    total: number
    pemandu?: number
    instruktur?: number
  }
  basePath: string
  onEdit?: (org: Organization) => void
  type?: string
}

export const MemberBranchCard = ({
  org,
  basePath,
  onEdit,
  type
}: MemberBranchCardProps) => {
  const labels: Record<string, string> = {
    pw: 'Wilayah',
    pd: 'Daerah',
    pdln: 'Daerah LN',
    pk: 'Komisariat',
    pp: 'Pusat',
    alumni: 'Total Alumni',
    pemandu: 'Total Pemandu',
    instruktur: 'Total Instruktur'
  }
  const colors: Record<string, string> = {
    pw: 'border-primary text-primary bg-primary/5',
    pd: '[border-color:var(--org-pd-border)] [color:var(--org-pd-text)] [background:var(--org-pd-bg)]',
    pdln: '[border-color:var(--org-pd-border)] [color:var(--org-pd-text)] [background:var(--org-pd-bg)]',
    pk: '[border-color:var(--org-pk-border)] [color:var(--org-pk-text)] [background:var(--org-pk-bg)]',
    pp: '[border-color:var(--org-pp-border)] [color:var(--org-pp-text)] [background:var(--org-pp-bg)]'
  }

  const isSpecialType = [
    'alumni',
    'pemandu',
    'instruktur',
    'perangkat'
  ].includes(type || '')

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
          {onEdit && (
            <Button
              variant='ghost'
              size='sm'
              aria-label={`Edit ${org.name}`}
              className='h-8 w-8 p-0 opacity-30 transition-opacity group-hover:opacity-100 focus-visible:opacity-100'
              onClick={() => onEdit(org)}
            >
              <HugeiconsIcon
                icon={Edit01Icon}
                strokeWidth={2}
                className='text-muted-foreground size-4'
              />
            </Button>
          )}
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

        <div className='grid grid-cols-3 gap-2 pt-2'>
          {type === 'perangkat' ? (
            <div className='col-span-3 grid grid-cols-2 gap-2'>
              <div className='bg-primary/10 border-primary/20 hover:bg-primary/20 flex flex-col items-center justify-center rounded-md border p-2 transition-colors'>
                <span className='text-primary text-[9px] font-bold tracking-wider uppercase'>
                  Pemandu
                </span>
                <span className='font-heading text-primary text-lg font-black tabular-nums'>
                  {org.pemandu || 0}
                </span>
              </div>
              <div className='bg-primary/10 border-primary/20 hover:bg-primary/20 flex flex-col items-center justify-center rounded-md border p-2 transition-colors'>
                <span className='text-primary text-[9px] font-bold tracking-wider uppercase'>
                  Instruktur
                </span>
                <span className='font-heading text-primary text-lg font-black tabular-nums'>
                  {org.instruktur || 0}
                </span>
              </div>
            </div>
          ) : isSpecialType ? (
            <div className='bg-primary/10 border-primary/20 hover:bg-primary/20 col-span-3 flex flex-col items-center justify-center rounded-md border p-3 transition-colors'>
              <span className='text-primary text-[10px] font-bold tracking-widest uppercase'>
                {labels[type || ''] || 'Total'}
              </span>
              <span className='font-heading text-primary text-2xl font-black tabular-nums'>
                {org.total}
              </span>
            </div>
          ) : (
            <>
              <div className='bg-muted/50 hover:bg-muted/80 flex flex-col items-center justify-center rounded-md p-2 transition-colors'>
                <span className='text-muted-foreground text-[9px] font-medium uppercase'>
                  Ikhwan
                </span>
                <span className='font-mono text-xs font-bold'>
                  {org.ikhwan}
                </span>
              </div>
              <div className='bg-muted/50 hover:bg-muted/80 flex flex-col items-center justify-center rounded-md p-2 transition-colors'>
                <span className='text-muted-foreground text-[9px] font-medium uppercase'>
                  Akhwat
                </span>
                <span className='font-mono text-xs font-bold'>
                  {org.akhwat}
                </span>
              </div>
              <div className='bg-primary/10 border-primary/10 hover:bg-primary/20 flex flex-col items-center justify-center rounded-md border p-2 transition-colors'>
                <span className='text-primary text-[9px] font-medium uppercase'>
                  Total
                </span>
                <span className='text-primary font-mono text-xs font-bold'>
                  {org.total}
                </span>
              </div>
            </>
          )}
        </div>

        {!isSpecialType ? (
          <div className='grid grid-cols-3 gap-2'>
            <div className='border-border/50 bg-card flex flex-col items-center rounded-md border p-2'>
              <span className='text-muted-foreground text-[8px] font-medium uppercase'>
                AB 1
              </span>
              <span className='font-mono text-xs font-semibold'>{org.ab1}</span>
            </div>
            <div className='border-border/50 bg-card flex flex-col items-center rounded-md border p-2'>
              <span className='text-muted-foreground text-[8px] font-medium uppercase'>
                AB 2
              </span>
              <span className='font-mono text-xs font-semibold'>{org.ab2}</span>
            </div>
            <div className='border-border/50 bg-card flex flex-col items-center rounded-md border p-2'>
              <span className='text-muted-foreground text-[8px] font-medium uppercase'>
                AB 3
              </span>
              <span className='font-mono text-xs font-semibold'>{org.ab3}</span>
            </div>
          </div>
        ) : null}
      </div>
      {org.childrenCount !== undefined && org.childrenCount > 0 && (
        <div className='border-border/50 mt-6 flex items-center justify-end border-t pt-4'>
          <div className='flex flex-col text-right'>
            <span className='text-muted-foreground text-[10px] font-medium tracking-tight uppercase'>
              Sub-struktur
            </span>
            <span className='text-foreground text-xs'>{org.childrenCount}</span>
          </div>
        </div>
      )}
    </div>
  )
}
