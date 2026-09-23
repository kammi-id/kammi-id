'use client'

import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Clock01Icon,
  CheckmarkCircle01Icon,
  UserGroupIcon,
  UserCheckIcon,
  ChevronRight
} from '@hugeicons/core-free-icons'
import { Badge } from '~/components/shadcn/ui/badge'
import { cn } from '~/lib/shadcn/utils'

const typeLabels: Record<string, string> = {
  dm1: 'DM 1',
  dm2: 'DM 2',
  dpmk: 'DPMK',
  tfi: 'TFI',
  dm3: 'DM 3',
  other: 'Lainnya'
}

const getStatus = (startDate: string, endDate: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (today < start) return 'scheduled'
  if (today > end) return 'completed'
  return 'ongoing'
}

const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const opts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }
  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    return `${start.toLocaleDateString('id-ID', { day: 'numeric' })}–${end.toLocaleDateString('id-ID', opts)}`
  }
  return `${start.toLocaleDateString('id-ID', opts)} – ${end.toLocaleDateString('id-ID', opts)}`
}

export interface TrainingCardData {
  id: string
  name: string
  startDate: string
  endDate: string
  type: string
  year: number
  identifier: number
  attendantCount: number
  masterName: string | null
  organization: { id: string; name: string; slug: string }
}

export const TrainingCard = ({ training }: { training: TrainingCardData }) => {
  const status = getStatus(training.startDate, training.endDate)
  const href = `/dashboard/trainings/${training.organization.slug}/${training.year}${String(training.identifier).padStart(3, '0')}`

  return (
    <article className='group border-border bg-card hover:border-primary/40 relative flex flex-col justify-between rounded-lg border p-5 transition-all hover:shadow-sm'>
      <div className='space-y-3'>
        {/* Badges */}
        <div className='flex flex-wrap items-center gap-1.5'>
          <Badge
            variant='outline'
            className='border-primary/20 bg-primary/5 text-primary font-mono text-[10px] font-bold tracking-wider uppercase'
          >
            {typeLabels[training.type] ?? training.type}
          </Badge>

          {status === 'scheduled' && (
            <span className='inline-flex items-center gap-1 rounded-full border border-[var(--color-status-warning-border)] bg-[var(--color-status-warning-bg)] px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-[var(--color-status-warning-text)] uppercase'>
              <HugeiconsIcon icon={Clock01Icon} className='size-2.5' />
              Terjadwal
            </span>
          )}
          {status === 'ongoing' && (
            <span className='border-primary/20 bg-primary/8 text-primary inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide uppercase'>
              <span className='bg-primary size-1.5 animate-pulse rounded-full' />
              Berlangsung
            </span>
          )}
          {status === 'completed' && (
            <span className='inline-flex items-center gap-1 rounded-full border border-[var(--color-status-success-border)] bg-[var(--color-status-success-bg)] px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-[var(--color-status-success-text)] uppercase'>
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                className='size-2.5'
              />
              Selesai
            </span>
          )}
        </div>

        {/* Name */}
        <Link
          href={href}
          className='focus-visible:ring-ring flex items-start justify-between gap-1 after:absolute after:inset-0 focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none'
        >
          <span className='text-foreground group-hover:text-primary leading-snug font-semibold transition-colors'>
            {training.name}
          </span>
          <HugeiconsIcon
            icon={ChevronRight}
            strokeWidth={2}
            className='text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5'
          />
        </Link>

        {/* Org + date */}
        <div className='space-y-0.5'>
          <p className='text-muted-foreground truncate text-xs'>
            {training.organization.name}
          </p>
          <p className='text-muted-foreground/70 text-xs'>
            {formatDateRange(training.startDate, training.endDate)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className='border-border/50 mt-4 flex items-center gap-3 border-t pt-3'>
        <div className='flex items-center gap-1.5'>
          <HugeiconsIcon
            icon={UserGroupIcon}
            className='text-muted-foreground size-3.5'
          />
          <span className='text-foreground font-mono text-xs font-semibold tabular-nums'>
            {training.attendantCount}
          </span>
          <span className='text-muted-foreground text-xs'>peserta</span>
        </div>

        {training.masterName && (
          <>
            <span className='text-border'>·</span>
            <div className='flex min-w-0 items-center gap-1.5'>
              <HugeiconsIcon
                icon={UserCheckIcon}
                className='text-muted-foreground size-3.5 shrink-0'
              />
              <span className='text-muted-foreground truncate text-xs'>
                {training.masterName}
              </span>
            </div>
          </>
        )}
      </div>
    </article>
  )
}
