'use client'

import { fmt } from '~/lib/utils/format'

const StatSplit = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className='font-geist-mono text-base font-semibold tabular-nums'>
      {fmt(value)}
    </div>
    <div className='text-muted-foreground text-xs tracking-wider uppercase'>
      {label}
    </div>
  </div>
)

interface TrainingSectionCardsProps {
  data: {
    total: number
    thisYear: number
    orgsWithTraining: number
    typesCount: Record<string, number>
  }
}

export const TrainingSectionCards = ({ data }: TrainingSectionCardsProps) => {
  const sortedTypes = Object.entries(data.typesCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)

  const maxCount = Math.max(...sortedTypes.map(([, c]) => c), 1)

  if (data.total === 0) {
    return (
      <div className='bg-card flex flex-col gap-3 rounded-xl border p-6'>
        <h2 className='text-muted-foreground text-xs font-medium tracking-tight uppercase'>
          Statistik Daurah
        </h2>
        <p className='text-muted-foreground text-sm'>
          Belum ada daurah yang tercatat.
        </p>
      </div>
    )
  }

  return (
    <div className='bg-card flex flex-col gap-5 rounded-xl border p-6'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h2 className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
            Total Daurah
          </h2>
          <div className='text-foreground font-geist-mono mt-1 text-4xl font-bold tracking-tight tabular-nums'>
            {fmt(data.total)}
          </div>
        </div>
        <div className='flex gap-6 pt-1'>
          <StatSplit label='Tahun Ini' value={data.thisYear} />
          <StatSplit label='Organisasi' value={data.orgsWithTraining} />
        </div>
      </div>

      {sortedTypes.length > 0 && (
        <>
          <div className='border-t' />
          <div className='flex flex-col gap-2.5'>
            {sortedTypes.map(([type, count]) => (
              <div key={type} className='flex items-center gap-3'>
                <span className='text-muted-foreground font-geist-mono w-12 text-xs font-medium uppercase'>
                  {type}
                </span>
                <div
                  role='progressbar'
                  aria-valuenow={Number(count)}
                  aria-valuemax={Number(maxCount)}
                  aria-label={`${type}: ${count}`}
                  className='bg-muted flex h-1.5 flex-1 overflow-hidden rounded-full'
                >
                  <div
                    className='bg-primary h-full transition-all'
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className='font-geist-mono w-8 text-right text-xs font-medium tabular-nums'>
                  {fmt(count)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
