'use client'

import { PieChart, Pie, Cell } from 'recharts'
import { fmt } from '~/lib/utils/format'

const AB_COLORS = ['oklch(0.65 0.18 145)', 'oklch(0.58 0.20 25)', 'oklch(0.55 0.18 265)']
const GENDER_COLORS = ['oklch(0.72 0.14 225)', 'oklch(0.74 0.14 350)']

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
    <div className='flex flex-col gap-3 rounded-xl border bg-card p-4'>
      <p className='text-xs font-medium text-muted-foreground'>{title}</p>
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
            <span className='font-mono text-sm font-bold tabular-nums text-foreground'>
              {fmt(total)}
            </span>
          </div>
        </div>
      </div>
      <div className='flex flex-wrap gap-x-3 gap-y-1.5'>
        {data.map((item, i) => (
          <div key={item.name} className='flex items-center gap-1.5'>
            <div
              className='size-2 shrink-0 rounded-full'
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className='text-xs text-muted-foreground'>{item.name}</span>
            <span className='font-mono text-xs font-semibold tabular-nums text-foreground'>
              {fmt(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const TotalCard = ({ label, value }: { label: string; value: number }) => (
  <div className='flex flex-col justify-between gap-2 rounded-xl border bg-card p-4'>
    <p className='text-xs font-medium text-muted-foreground'>{label}</p>
    <span className='font-mono text-5xl font-bold tabular-nums tracking-tight text-foreground'>
      {fmt(value)}
    </span>
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
      <div className='rounded-xl border bg-card px-5 py-4'>
        <p className='text-sm text-muted-foreground'>
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
      <div className='grid grid-cols-2 gap-4'>
        <DonutCard title='Komposisi Gender' data={genderData} colors={GENDER_COLORS} />
        <TotalCard label='Total Alumni' value={total} />
      </div>
    )
  }

  return (
    <div className='grid grid-cols-3 gap-4'>
      <DonutCard title='Jenjang' data={abData} colors={AB_COLORS} />
      <DonutCard title='Komposisi Gender' data={genderData} colors={GENDER_COLORS} />
      <TotalCard label='Total Kader' value={total} />
    </div>
  )
}
