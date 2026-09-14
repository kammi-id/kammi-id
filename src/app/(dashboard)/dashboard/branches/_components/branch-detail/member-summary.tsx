'use client'

import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer, type ChartConfig } from '~/components/shadcn/ui/chart'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/shadcn/ui/card'
import { fmt } from '~/lib/utils/format'

type MemberSummaryData = {
  total: number
  ab1: number
  ab2: number
  ab3: number
  ikhwan: number
  akhwat: number
  pemandu: number
  instruktur: number
}

type DonutSlice = {
  color: string
  label: string
  value: number
}

// SVG fill attributes need concrete colors; these mirror the Kader dashboard.
const colors = {
  ab1: 'oklch(0.65 0.18 145)',
  ab2: 'oklch(0.58 0.2 25)',
  ab3: 'oklch(0.55 0.18 265)',
  ikhwan: 'oklch(0.72 0.14 225)',
  akhwat: 'oklch(0.74 0.14 350)'
}

const DonutPanel = ({
  title,
  description,
  slices,
  config
}: {
  title: string
  description: string
  slices: DonutSlice[]
  config: ChartConfig
}) => {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className='flex items-center gap-4'>
        <ChartContainer
          config={config}
          className='size-28 shrink-0'
          role='img'
          aria-label={`${title}: ${fmt(total)} Kader`}
        >
          <PieChart accessibilityLayer={false}>
            <Pie
              data={slices}
              dataKey='value'
              innerRadius={34}
              outerRadius={52}
              paddingAngle={2}
              strokeWidth={0}
              rootTabIndex={-1}
            >
              {slices.map((slice) => (
                <Cell key={slice.label} fill={slice.color} />
              ))}
            </Pie>
            <text
              x='50%'
              y='50%'
              fill='var(--foreground)'
              textAnchor='middle'
              dominantBaseline='middle'
              className='fill-foreground text-sm font-bold tabular-nums'
            >
              {fmt(total)}
            </text>
          </PieChart>
        </ChartContainer>
        <dl className='flex min-w-0 flex-1 flex-col gap-2'>
          {slices.map((slice) => (
            <div key={slice.label} className='flex items-center gap-2 text-sm'>
              <span
                aria-hidden
                className='size-2.5 shrink-0 rounded-full'
                style={{ backgroundColor: slice.color }}
              />
              <dt className='text-muted-foreground truncate'>{slice.label}</dt>
              <dd className='ml-auto font-semibold tabular-nums'>
                {fmt(slice.value)}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

const jenjangConfig = {
  ab1: { label: 'AB1', color: colors.ab1 },
  ab2: { label: 'AB2', color: colors.ab2 },
  ab3: { label: 'AB3', color: colors.ab3 }
} satisfies ChartConfig

const genderConfig = {
  ikhwan: { label: 'Ikhwan', color: colors.ikhwan },
  akhwat: { label: 'Akhwat', color: colors.akhwat }
} satisfies ChartConfig

export const MemberSummary = ({ data }: { data: MemberSummaryData }) => (
  <section
    aria-labelledby='member-summary-title'
    className='@container flex flex-col gap-4'
  >
    <div>
      <h2 id='member-summary-title' className='font-heading text-xl font-bold'>
        Ringkasan Kader
      </h2>
      <p className='text-muted-foreground mt-1 text-sm'>
        Kader Aktif dalam Cakupan Struktur ini.
      </p>
    </div>

    <div className='grid grid-cols-1 gap-4 @md:grid-cols-2 @2xl:grid-cols-3'>
      <Card className='bg-primary text-primary-foreground h-full @2xl:row-span-2'>
        <CardHeader>
          <CardTitle className='text-primary-foreground'>Kader Aktif</CardTitle>
          <CardDescription className='text-primary-foreground'>
            Total dalam Cakupan
          </CardDescription>
        </CardHeader>
        <CardContent className='flex min-h-32 flex-1 items-center justify-center text-center'>
          <data
            value={data.total}
            className='font-heading text-6xl font-bold tracking-tight tabular-nums @2xl:text-8xl'
          >
            {fmt(data.total)}
          </data>
        </CardContent>
      </Card>

      <DonutPanel
        title='Jenjang Kekaderan'
        description='Komposisi AB1–AB3'
        config={jenjangConfig}
        slices={[
          { label: 'AB1', value: data.ab1, color: colors.ab1 },
          { label: 'AB2', value: data.ab2, color: colors.ab2 },
          { label: 'AB3', value: data.ab3, color: colors.ab3 }
        ]}
      />

      <DonutPanel
        title='Jenis Kelamin'
        description='Komposisi Kader Aktif'
        config={genderConfig}
        slices={[
          { label: 'Ikhwan', value: data.ikhwan, color: colors.ikhwan },
          { label: 'Akhwat', value: data.akhwat, color: colors.akhwat }
        ]}
      />

      <Card className='h-full'>
        <CardHeader>
          <CardTitle>Perangkat</CardTitle>
          <CardDescription>Pemandu dan Instruktur</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className='flex flex-col gap-5'>
            <div className='flex items-center gap-3'>
              <span
                aria-hidden
                className='size-3 shrink-0 rounded-full bg-[var(--chart-pemandu)]'
              />
              <dt className='text-muted-foreground flex-1 text-sm'>Pemandu</dt>
              <dd className='text-2xl font-bold tabular-nums'>
                {fmt(data.pemandu)}
              </dd>
            </div>
            <div className='flex items-center gap-3'>
              <span
                aria-hidden
                className='size-3 shrink-0 rounded-full bg-[var(--chart-instruktur)]'
              />
              <dt className='text-muted-foreground flex-1 text-sm'>
                Instruktur
              </dt>
              <dd className='text-2xl font-bold tabular-nums'>
                {fmt(data.instruktur)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  </section>
)
