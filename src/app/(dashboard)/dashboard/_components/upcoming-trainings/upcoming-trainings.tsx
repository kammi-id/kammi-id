import Link from 'next/link'
import {
  ArrowRight01Icon,
  Calendar03Icon,
  AlertCircleIcon
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { cn } from '~/lib/shadcn/utils'
import type { UpcomingTraining } from '~/app/(dashboard)/dashboard/_data/trainings'

const typeLabels: Record<string, string> = {
  dm1: 'DM 1',
  dm2: 'DM 2',
  dpmk: 'DPMK',
  tfi: 'TFI',
  dm3: 'DM 3',
  other: 'Lainnya'
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

const getDaysUntil = (dateStr: string) => {
  const start = new Date(dateStr)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export const UpcomingTrainings = ({ data }: { data: UpcomingTraining[] }) => {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-base font-semibold tracking-tight'>
            Daurah Terdekat
          </h2>
          <p className='text-muted-foreground text-xs'>
            Yang akan datang dalam scope organisasi
          </p>
        </div>
        <Link
          href='/dashboard/trainings'
          className='text-primary focus-visible:ring-ring inline-flex min-h-11 items-center gap-1 text-xs font-medium hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none'
        >
          Semua daurah
          <HugeiconsIcon icon={ArrowRight01Icon} className='size-3' />
        </Link>
      </div>

      {data.length === 0 ? (
        <div className='bg-card flex flex-col items-center justify-center gap-2 rounded-xl border py-12 text-center'>
          <HugeiconsIcon
            icon={Calendar03Icon}
            className='text-muted-foreground/30 size-8'
          />
          <p className='text-muted-foreground text-sm font-medium'>
            Tidak ada daurah yang akan datang.
          </p>
          <Link
            href='/dashboard/trainings'
            className='text-primary focus-visible:ring-ring inline-flex min-h-11 items-center gap-1 text-xs hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none'
          >
            Tambah daurah baru
            <HugeiconsIcon icon={ArrowRight01Icon} className='size-3' />
          </Link>
        </div>
      ) : (
        <div className='bg-card flex flex-col divide-y overflow-hidden rounded-xl border'>
          {data.map((training) => {
            const days = getDaysUntil(training.startDate)
            const isUrgent = days >= 0 && days <= 7
            const href = `/dashboard/trainings/${training.organization.slug}/${training.year}${String(training.identifier).padStart(3, '0')}`

            return (
              <div
                key={training.id}
                className={cn(
                  'hover:bg-muted/40 flex items-center justify-between gap-4 px-4 py-3 transition-colors',
                  isUrgent && 'bg-primary/[0.03]'
                )}
              >
                <div className='flex min-w-0 flex-col gap-0.5'>
                  <div className='flex items-center gap-2'>
                    {isUrgent && (
                      <HugeiconsIcon
                        icon={AlertCircleIcon}
                        className='text-primary size-3.5 shrink-0'
                      />
                    )}
                    <Link
                      href={href}
                      className='hover:text-primary focus-visible:ring-ring truncate text-sm font-medium transition-colors hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none'
                    >
                      {training.name}
                    </Link>
                  </div>
                  <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                    <span className='text-muted-foreground/60 font-mono'>
                      {training.year}
                      {String(training.identifier).padStart(3, '0')}
                    </span>
                    <span>&middot;</span>
                    <span>{training.organization.name}</span>
                    <span>&middot;</span>
                    <span className='bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-[10px] font-bold'>
                      {typeLabels[training.type] ?? training.type}
                    </span>
                  </div>
                </div>

                <div className='shrink-0 text-right'>
                  {isUrgent ? (
                    <span className='text-primary font-mono text-xs font-semibold'>
                      {days === 0
                        ? 'Hari ini'
                        : days === 1
                          ? 'Besok'
                          : `${days} hari lagi`}
                    </span>
                  ) : (
                    <span className='text-muted-foreground/60 font-mono text-xs'>
                      {formatDate(training.startDate)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
