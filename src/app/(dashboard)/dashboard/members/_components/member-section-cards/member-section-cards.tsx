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
}

export const MemberSectionCards = ({ data }: MemberSectionCardsProps) => {
  const secondaryMetrics = [
    { label: 'AB 3', value: data.ab3, color: 'green' },
    { label: 'AB 2', value: data.ab2, color: 'red' },
    { label: 'AB 1', value: data.ab1, color: 'blue' },
    { label: 'Ikhwan', value: data.ikhwan, color: 'blue' },
    { label: 'Akhwat', value: data.akhwat, color: 'pink' }
  ]

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
    <div className='flex flex-col gap-6 px-4 lg:px-6'>
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-3'>
        {secondaryMetrics.map((metric) => {
          const styles = colorMap[metric.color]
          return (
            <Card
              key={metric.label}
              className={cn(
                'relative overflow-hidden p-5 transition-all',
                styles.bg,
                styles.border
              )}
            >
              <CardDescription
                className={cn(
                  'text-xs font-medium tracking-wider uppercase',
                  styles.text
                )}
              >
                {metric.label}
              </CardDescription>
              <CardTitle
                className={cn(
                  'font-heading mt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl',
                  styles.text
                )}
              >
                {metric.value.toLocaleString('id-ID')}
              </CardTitle>
              <div
                className={cn(
                  'absolute -right-2 -bottom-2 size-16 rounded-full blur-2xl',
                  styles.glow
                )}
              />
            </Card>
          )
        })}
        <Card
          className={cn(
            'relative overflow-hidden p-5 transition-all',
            colorMap.primary.bg,
            colorMap.primary.border
          )}
        >
          <CardDescription
            className={cn(
              'text-xs font-medium tracking-wider uppercase',
              colorMap.primary.text
            )}
          >
            Jumlah Kader
          </CardDescription>
          <CardTitle
            className={cn(
              'font-heading mt-1 text-2xl font-extrabold tracking-tight tabular-nums sm:text-3xl',
              colorMap.primary.text
            )}
          >
            {data.total.toLocaleString('id-ID')}
          </CardTitle>
          <div
            className={cn(
              'absolute -right-2 -bottom-2 size-16 rounded-full blur-2xl',
              colorMap.primary.glow
            )}
          />
        </Card>
      </div>
    </div>
  )
}
