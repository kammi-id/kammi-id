'use client'

import { Badge } from '~/components/shadcn/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/components/shadcn/ui/card'
import { HugeiconsIcon } from '@hugeicons/react'
import { ChartUpIcon, ChartDownIcon } from '@hugeicons/core-free-icons'

/**
 * SectionCards component displays high-level summary metrics (KPIs)
 * in a responsive grid of cards.
 *
 * It uses a flexible grid system that adapts based on the container size,
 * showcasing key data like Revenue, Customers, and Growth Rate.
 *
 * @returns A React element rendering the section cards grid.
 */
export const SectionCards = () => {
  return (
    <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className='text-2xl font-bold tracking-tight tabular-nums @[250px]/card:text-3xl'>
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge
              variant='outline'
              className='gap-1 px-1.5 py-0 text-xs font-medium'
            >
              <HugeiconsIcon
                icon={ChartUpIcon}
                strokeWidth={2}
                className='size-3'
              />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex items-center gap-2 font-semibold tracking-tight'>
            Trending up this month{' '}
            <HugeiconsIcon
              icon={ChartUpIcon}
              strokeWidth={2}
              className='text-primary size-3.5'
            />
          </div>
          <div className='text-muted-foreground leading-relaxed'>
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className='text-2xl font-bold tracking-tight tabular-nums @[250px]/card:text-3xl'>
            1,234
          </CardTitle>
          <CardAction>
            <Badge
              variant='outline'
              className='gap-1 px-1.5 py-0 text-xs font-medium'
            >
              <HugeiconsIcon
                icon={ChartDownIcon}
                strokeWidth={2}
                className='size-3'
              />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex items-center gap-2 font-semibold tracking-tight'>
            Down 20% this period{' '}
            <HugeiconsIcon
              icon={ChartDownIcon}
              strokeWidth={2}
              className='text-destructive size-3.5'
            />
          </div>
          <div className='text-muted-foreground leading-relaxed'>
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className='text-2xl font-bold tracking-tight tabular-nums @[250px]/card:text-3xl'>
            45,678
          </CardTitle>
          <CardAction>
            <Badge
              variant='outline'
              className='gap-1 px-1.5 py-0 text-xs font-medium'
            >
              <HugeiconsIcon
                icon={ChartUpIcon}
                strokeWidth={2}
                className='size-3'
              />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex items-center gap-2 font-semibold tracking-tight'>
            Strong user retention{' '}
            <HugeiconsIcon
              icon={ChartUpIcon}
              strokeWidth={2}
              className='text-primary size-3.5'
            />
          </div>
          <div className='text-muted-foreground leading-relaxed'>
            Engagement exceed targets
          </div>
        </CardFooter>
      </Card>
      <Card className='@container/card'>
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className='text-2xl font-bold tracking-tight tabular-nums @[250px]/card:text-3xl'>
            4.5%
          </CardTitle>
          <CardAction>
            <Badge
              variant='outline'
              className='gap-1 px-1.5 py-0 text-xs font-medium'
            >
              <HugeiconsIcon
                icon={ChartUpIcon}
                strokeWidth={2}
                className='size-3'
              />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className='flex-col items-start gap-1.5 text-sm'>
          <div className='line-clamp-1 flex items-center gap-2 font-semibold tracking-tight'>
            Steady performance increase{' '}
            <HugeiconsIcon
              icon={ChartUpIcon}
              strokeWidth={2}
              className='text-primary size-3.5'
            />
          </div>
          <div className='text-muted-foreground leading-relaxed'>
            Meets growth projections
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
