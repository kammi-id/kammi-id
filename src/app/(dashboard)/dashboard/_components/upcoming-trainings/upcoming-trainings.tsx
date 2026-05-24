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
            Dauroh Terdekat
          </h2>
          <p className='text-xs text-muted-foreground'>
            Yang akan datang dalam scope organisasi
          </p>
        </div>
        <Link
          href='/dashboard/trainings'
          className='inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline'
        >
          Semua dauroh
          <HugeiconsIcon icon={ArrowRight01Icon} className='size-3' />
        </Link>
      </div>

      {data.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-2 rounded-xl border bg-card py-12 text-center'>
          <HugeiconsIcon
            icon={Calendar03Icon}
            className='size-8 text-muted-foreground/30'
          />
          <p className='text-sm font-medium text-muted-foreground'>
            Tidak ada dauroh yang akan datang.
          </p>
          <Link
            href='/dashboard/trainings'
            className='inline-flex items-center gap-1 text-xs text-primary hover:underline'
          >
            Tambah dauroh baru
            <HugeiconsIcon icon={ArrowRight01Icon} className='size-3' />
          </Link>
        </div>
      ) : (
        <div className='flex flex-col divide-y overflow-hidden rounded-xl border bg-card'>
          {data.map((training) => {
            const days = getDaysUntil(training.startDate)
            const isUrgent = days >= 0 && days <= 7
            const href = `/dashboard/trainings/${training.organization.codeSlug}/${training.year}${String(training.identifier).padStart(3, '0')}`

            return (
              <div
                key={training.id}
                className={cn(
                  'flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40',
                  isUrgent && 'bg-primary/[0.03]'
                )}
              >
                <div className='flex min-w-0 flex-col gap-0.5'>
                  <div className='flex items-center gap-2'>
                    {isUrgent && (
                      <HugeiconsIcon
                        icon={AlertCircleIcon}
                        className='size-3.5 shrink-0 text-primary'
                      />
                    )}
                    <Link
                      href={href}
                      className='truncate text-sm font-medium transition-colors hover:text-primary hover:underline'
                    >
                      {training.name}
                    </Link>
                  </div>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <span className='font-mono text-muted-foreground/60'>
                      {training.year}
                      {String(training.identifier).padStart(3, '0')}
                    </span>
                    <span>&middot;</span>
                    <span>{training.organization.name}</span>
                    <span>&middot;</span>
                    <span className='rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary'>
                      {typeLabels[training.type] ?? training.type}
                    </span>
                  </div>
                </div>

                <div className='shrink-0 text-right'>
                  {isUrgent ? (
                    <span className='font-mono text-xs font-semibold text-primary'>
                      {days === 0
                        ? 'Hari ini'
                        : days === 1
                          ? 'Besok'
                          : `${days} hari lagi`}
                    </span>
                  ) : (
                    <span className='font-mono text-xs text-muted-foreground/60'>
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
