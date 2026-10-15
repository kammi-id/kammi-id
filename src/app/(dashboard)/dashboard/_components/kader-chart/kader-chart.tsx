'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/shadcn/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from '~/components/shadcn/ui/chart'
import type { MemberYearDistributionResult } from '~/db/query/member'

const chartConfig = {
  count: {
    label: 'Kader',
    color: 'var(--primary)'
  }
} satisfies ChartConfig

export const KaderChart = ({
  data
}: {
  data: MemberYearDistributionResult[]
}) => {
  if (data.length === 0) {
    return null
  }

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base font-semibold tracking-tight'>
          Distribusi Kader per Angkatan
        </CardTitle>
        <CardDescription className='text-xs'>
          Jumlah kader aktif berdasarkan tahun masuk
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pb-4 sm:px-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[180px] w-full'
        >
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id='fillKader' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-count)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-count)'
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray='3 3'
              strokeOpacity={0.4}
            />
            <XAxis
              dataKey='year'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={4}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => `Angkatan ${value}`}
                  indicator='dot'
                />
              }
            />
            <Area
              dataKey='count'
              type='monotone'
              fill='url(#fillKader)'
              stroke='var(--color-count)'
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
