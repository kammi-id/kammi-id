'use client'

import { fmt } from '~/lib/utils/format'

const StatSplit = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className='font-mono text-base font-semibold tabular-nums'>{fmt(value)}</div>
    <div className='text-xs uppercase tracking-wider text-muted-foreground'>{label}</div>
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
      <div className='flex flex-col gap-3 rounded-xl border bg-card p-6'>
        <div className='text-xs font-medium uppercase tracking-tight text-muted-foreground'>
          Statistik Dauroh
        </div>
        <p className='text-sm text-muted-foreground'>Belum ada dauroh yang tercatat.</p>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-5 rounded-xl border bg-card p-6'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <div className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
            Total Dauroh
          </div>
          <div className='mt-1 font-mono text-4xl font-bold tabular-nums tracking-tight text-foreground'>
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
                <span className='w-12 font-mono text-xs font-medium uppercase text-muted-foreground'>
                  {type}
                </span>
                <div className='flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full bg-primary transition-all'
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className='w-8 text-right font-mono text-xs font-medium tabular-nums'>
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
