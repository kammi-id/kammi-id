'use client'

import { PieChart, Pie, Cell } from 'recharts'
import { fmt } from '~/lib/utils/format'
import { cn } from '~/lib/shadcn/utils'

const AB_COLORS = [
  'var(--status-ab1-solid)',
  'var(--status-ab2-solid)',
  'var(--status-ab3-solid)'
]
const GENDER_COLORS = [
  'var(--gender-ikhwan-solid)',
  'var(--gender-akhwat-solid)'
]

const DonutCard = ({
  title,
  data,
  colors
}: {
  title: string
  data: { name: string; value: number }[]
  colors: string[]
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className='bg-card flex flex-col gap-3 rounded-xl border p-4'>
      <p className='text-muted-foreground text-xs font-medium'>{title}</p>
      <div className='flex items-center justify-center py-1'>
        <div className='relative'>
          <PieChart width={140} height={140}>
            <Pie
              data={data}
              innerRadius={42}
              outerRadius={66}
              paddingAngle={2}
              dataKey='value'
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
          </PieChart>
          <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
            <span className='text-foreground font-mono text-sm font-bold tabular-nums'>
              {fmt(total)}
            </span>
          </div>
        </div>
      </div>
      <div
        className={cn(
          'grid gap-2',
          data.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
        )}
      >
        {data.map((item, i) => (
          <div
            key={item.name}
            className='legend-item flex flex-col gap-1 rounded-lg [background-color:color-mix(in_oklch,var(--legend-color)_10%,transparent)] px-2 py-1.5'
            // @ts-expect-error CSS custom property
            style={{ '--legend-color': colors[i % colors.length] }}
          >
            <div className='flex items-center gap-1.5'>
              <div className='size-2.5 shrink-0 rounded-full bg-[var(--legend-color)]' />
              <span className='text-[11px] leading-none font-medium text-[var(--legend-color)]'>
                {item.name}
              </span>
            </div>
            <span className='text-foreground pl-4 font-mono text-base font-bold tabular-nums'>
              {fmt(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const TotalCard = ({ label, value }: { label: string; value: number }) => (
  <div className='bg-card flex flex-col gap-2 rounded-xl border p-4'>
    <p className='text-muted-foreground text-xs font-medium'>{label}</p>
    <div className='flex flex-1 items-center justify-center py-4'>
      <span className='font-heading text-foreground text-5xl font-extrabold tracking-tight tabular-nums'>
        {fmt(value)}
      </span>
    </div>
  </div>
)

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
  const { total, ab1, ab2, ab3, ikhwan, akhwat } = data
  const isAlumni = type === 'alumni'

  if (total === 0) {
    return (
      <div className='bg-card rounded-xl border px-5 py-4'>
        <p className='text-muted-foreground text-sm'>
          Belum ada data dalam scope ini.
        </p>
      </div>
    )
  }

  const abData = [
    { name: 'AB 1', value: ab1 },
    { name: 'AB 2', value: ab2 },
    { name: 'AB 3', value: ab3 }
  ]

  const genderData = [
    { name: 'Ikhwan', value: ikhwan },
    { name: 'Akhwat', value: akhwat }
  ]

  if (isAlumni) {
    return (
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
        <DonutCard
          title='Komposisi Jenis Kelamin'
          data={genderData}
          colors={GENDER_COLORS}
        />
        <TotalCard label='Total Alumni' value={total} />
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      <DonutCard title='Jenjang' data={abData} colors={AB_COLORS} />
      <DonutCard
        title='Komposisi Jenis Kelamin'
        data={genderData}
        colors={GENDER_COLORS}
      />
      <TotalCard label='Total Kader' value={total} />
    </div>
  )
}
