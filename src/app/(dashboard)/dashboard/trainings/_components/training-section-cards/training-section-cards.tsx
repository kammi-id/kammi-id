'use client'

import { Card, CardDescription, CardTitle } from '~/components/shadcn/ui/card'
import { cn } from '~/lib/shadcn/utils'

interface TrainingSectionCardsProps {
  data: {
    total: number
    thisYear: number
    orgsWithTraining: number
    typesCount: Record<string, number>
  }
}

export const TrainingSectionCards = ({ data }: TrainingSectionCardsProps) => {
  // Sort types by count to show top ones
  const sortedTypes = Object.entries(data.typesCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)

  return (
    <div className='flex flex-col gap-8 px-0'>
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
        <Card
          className={cn(
            'border-border bg-primary/5 relative col-span-1 overflow-hidden border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-md lg:col-span-1'
          )}
        >
          <CardDescription className='text-primary text-xs font-bold tracking-widest uppercase opacity-80'>
            Total Dauroh
          </CardDescription>
          <CardTitle className='font-heading text-primary mt-2 text-5xl font-black tracking-tighter tabular-nums sm:text-6xl'>
            {data.total.toLocaleString('id-ID')}
          </CardTitle>
          <div className='bg-primary absolute top-4 right-4 size-2 animate-pulse rounded-full' />
        </Card>

        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-3'>
          <Card
            className={cn(
              'border-border bg-primary/5 relative overflow-hidden border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-sm'
            )}
          >
            <CardDescription className='text-primary text-[10px] font-bold tracking-widest uppercase opacity-70'>
              Tahun Ini
            </CardDescription>
            <CardTitle className='font-heading text-primary mt-1 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl'>
              {data.thisYear.toLocaleString('id-ID')}
            </CardTitle>
          </Card>

          <Card
            className={cn(
              'border-border bg-primary/5 relative overflow-hidden border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-sm'
            )}
          >
            <CardDescription className='text-primary text-[10px] font-bold tracking-widest uppercase opacity-70'>
              Organisasi
            </CardDescription>
            <CardTitle className='font-heading text-primary mt-1 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl'>
              {data.orgsWithTraining.toLocaleString('id-ID')}
            </CardTitle>
          </Card>

          {sortedTypes.map(([type, count]) => (
            <Card
              key={type}
              className={cn(
                'border-border bg-primary/5 relative overflow-hidden border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-sm'
              )}
            >
              <CardDescription className='text-primary text-[10px] font-bold tracking-widest uppercase opacity-70'>
                {type.toUpperCase()}
              </CardDescription>
              <CardTitle className='font-heading text-primary mt-1 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl'>
                {count.toLocaleString('id-ID')}
              </CardTitle>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
