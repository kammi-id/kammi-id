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
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
      <div className='flex flex-col gap-2 rounded-xl border bg-card p-4'>
        <p className='text-xs font-medium text-muted-foreground'>Total Pemandu</p>
        <div className='flex flex-1 items-center justify-center py-4'>
          <span className='font-heading text-5xl font-extrabold tabular-nums tracking-tight text-foreground'>
            {fmt(pemanduCount)}
          </span>
        </div>
      </div>
      <div className='flex flex-col gap-2 rounded-xl border bg-card p-4'>
        <p className='text-xs font-medium text-muted-foreground'>Total Instruktur</p>
        <div className='flex flex-1 items-center justify-center py-4'>
          <span className='font-heading text-5xl font-extrabold tabular-nums tracking-tight text-foreground'>
            {fmt(instrukturCount)}
          </span>
        </div>
      </div>
    </div>
  )
}
