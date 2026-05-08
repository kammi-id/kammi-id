'use client'

import { Card, CardDescription, CardTitle } from '~/components/shadcn/ui/card'
import { cn } from '~/lib/shadcn/utils'

interface SpecialistSummaryCardsProps {
  pemanduCount: number
  instrukturCount: number
}

export const SpecialistSummaryCards = ({
  pemanduCount,
  instrukturCount
}: SpecialistSummaryCardsProps) => {
  const metrics = [
    { label: 'Total Pemandu', value: pemanduCount, accent: 'primary' },
    { label: 'Total Instruktur', value: instrukturCount, accent: 'primary' }
  ]

  return (
    <div className='flex flex-col gap-8 px-0'>
      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2'>
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className={cn(
              'border-border bg-primary/5 relative overflow-hidden border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-sm'
            )}
          >
            <CardDescription className='text-primary text-xs font-bold tracking-widest uppercase opacity-80'>
              {metric.label}
            </CardDescription>
            <CardTitle className='font-heading text-primary mt-2 text-5xl font-black tracking-tighter tabular-nums sm:text-6xl'>
              {metric.value.toLocaleString('id-ID')}
            </CardTitle>
            <div className='bg-primary absolute top-4 right-4 size-2 animate-pulse rounded-full' />
          </Card>
        ))}
      </div>
    </div>
  )
}
