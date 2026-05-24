'use client'

import { fmt } from '~/lib/utils/format'

interface SpecialistSummaryCardsProps {
  pemanduCount: number
  instrukturCount: number
}

export const SpecialistSummaryCards = ({
  pemanduCount,
  instrukturCount
}: SpecialistSummaryCardsProps) => {
  return (
    <div className='grid grid-cols-2 gap-4'>
      <div className='flex flex-col justify-between gap-2 rounded-xl border bg-card p-4'>
        <p className='text-xs font-medium text-muted-foreground'>Total Pemandu</p>
        <span className='font-mono text-4xl font-bold tabular-nums tracking-tight text-foreground'>
          {fmt(pemanduCount)}
        </span>
      </div>
      <div className='flex flex-col justify-between gap-2 rounded-xl border bg-card p-4'>
        <p className='text-xs font-medium text-muted-foreground'>Total Instruktur</p>
        <span className='font-mono text-4xl font-bold tabular-nums tracking-tight text-foreground'>
          {fmt(instrukturCount)}
        </span>
      </div>
    </div>
  )
}
