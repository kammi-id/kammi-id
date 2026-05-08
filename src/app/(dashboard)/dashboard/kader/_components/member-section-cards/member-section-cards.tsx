'use client'

import { Card, CardDescription, CardTitle } from '~/components/shadcn/ui/card'
import { cn } from '~/lib/shadcn/utils'

interface MemberSectionCardsProps {
  data: {
    ab3: number
    ab2: number
    ab1: number
    ikhwan: number
    akhwat: number
    total: number
  }
  type?: string
}

export const MemberSectionCards = ({ data, type }: MemberSectionCardsProps) => {
  const secondaryMetrics = [
    { label: 'AB 3', value: data.ab3 },
    { label: 'AB 2', value: data.ab2 },
    { label: 'AB 1', value: data.ab1 },
    { label: 'Ikhwan', value: data.ikhwan },
    { label: 'Akhwat', value: data.akhwat }
  ].filter((metric) => {
    if (type === 'alumni') return false
    if (type === 'pemandu' || type === 'instruktur') {
      return !['AB 1', 'AB 2', 'AB 3'].includes(metric.label)
    }
    return true
  })

  const colorMap: Record<
    string,
    { bg: string; border: string; text: string; glow: string }
  > = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      glow: 'bg-blue-400/20'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      glow: 'bg-red-400/20'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      glow: 'bg-green-400/20'
    },
    pink: {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-700',
      glow: 'bg-pink-400/20'
    },
    primary: {
      bg: 'bg-primary/5',
      border: 'border-primary/30',
      text: 'text-primary',
      glow: 'bg-primary/10'
    }
  }

  return (
    <div className='flex flex-col gap-8 px-0'>
      <div
        className={cn(
          'grid grid-cols-1 gap-6',
          type === 'alumni' ? 'max-w-sm' : 'lg:grid-cols-4'
        )}
      >
        <Card
          className={cn(
            'border-border bg-primary/5 relative col-span-1 overflow-hidden border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-md lg:col-span-1'
          )}
        >
          <CardDescription className='text-primary text-xs font-bold tracking-widest uppercase opacity-80'>
            {type === 'alumni' ? 'Jumlah Alumni' : 'Jumlah Kader'}
          </CardDescription>
          <CardTitle className='font-heading text-primary mt-2 text-5xl font-black tracking-tighter tabular-nums sm:text-6xl'>
            {data.total.toLocaleString('id-ID')}
          </CardTitle>
          <div className='bg-primary absolute top-4 right-4 size-2 animate-pulse rounded-full' />
        </Card>

        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:col-span-3'>
          {secondaryMetrics.map((metric) => (
            <Card
              key={metric.label}
              className={cn(
                'border-border bg-primary/5 relative overflow-hidden border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-sm'
              )}
            >
              <CardDescription className='text-primary text-[10px] font-bold tracking-widest uppercase opacity-70'>
                {metric.label}
              </CardDescription>
              <CardTitle className='font-heading text-primary mt-1 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl'>
                {metric.value.toLocaleString('id-ID')}
              </CardTitle>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
