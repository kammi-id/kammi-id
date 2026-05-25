'use client'

import Link from 'next/link'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ChartContainer, type ChartConfig } from '~/components/shadcn/ui/chart'
import {
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '~/components/shadcn/ui/tooltip'
import type { MemberOrgDistributionResult } from '~/db/query/member'
import { fmt } from '~/lib/utils/format'

export type KaderBentoStatsData = {
  total: number
  ab1: number
  ab2: number
  ab3: number
  ikhwan: number
  akhwat: number
  pemandu: number
  instruktur: number
}

export type KaderBentoStatsProps = {
  data: KaderBentoStatsData
  pwDistribution: MemberOrgDistributionResult[]
  pdDistribution: MemberOrgDistributionResult[]
}

// COLORS for Recharts Cell fill — SVG fill attr does not resolve CSS var(),
// so we use oklch literals that match the status/gender tokens in globals.css.
const COLORS = {
  ab1: 'oklch(0.65 0.18 145)', // --status-ab1-solid
  ab2: 'oklch(0.58 0.20 25)', // --status-ab2-solid
  ab3: 'oklch(0.55 0.18 265)', // --status-ab3-solid
  ikhwan: 'oklch(0.72 0.14 225)', // --gender-ikhwan-solid
  akhwat: 'oklch(0.74 0.14 350)', // --gender-akhwat-solid
  pemandu: 'oklch(0.55 0.16 150)',
  instruktur: 'oklch(0.55 0.16 280)'
}

const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100)

const shortName = (name: string) =>
  name.replace(/^(PW|PD|PK|KAMMI)\s+/i, '').slice(0, 20)

// ─── Total Card ───────────────────────────────────────────────────────────────

const KaderTotalCard = ({ data }: { data: KaderBentoStatsData }) => (
  <div className='bg-card flex h-full flex-col justify-center rounded-xl border p-5'>
    <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
      Kader Aktif
    </p>
    <p
      className='font-heading text-foreground mt-3 font-bold tracking-tight tabular-nums'
      style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', lineHeight: 1.1 }}
    >
      {fmt(data.total)}
    </p>
  </div>
)

// ─── Donut shared ─────────────────────────────────────────────────────────────

type DonutSlice = { name: string; label: string; value: number; color: string }

const KaderDonut = ({
  title,
  slices,
  config
}: {
  title: string
  slices: DonutSlice[]
  config: ChartConfig
}) => {
  const total = slices.reduce((s, d) => s + d.value, 0)

  return (
    <div className='bg-card flex h-full flex-col rounded-xl border p-5'>
      <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
        {title}
      </p>
      <div className='mt-3 flex flex-1 items-center gap-4'>
        <ChartContainer
          config={config}
          className='h-[100px] w-[100px] shrink-0'
        >
          <PieChart>
            <Pie
              data={slices}
              dataKey='value'
              innerRadius={30}
              outerRadius={48}
              paddingAngle={2}
              strokeWidth={0}
            >
              {slices.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            {/* Center total — anchor for proportion reading without mental math */}
            <text
              x='50%'
              y='50%'
              textAnchor='middle'
              dominantBaseline='middle'
              style={{
                fontSize: 14,
                fontFamily: 'var(--font-geist-mono)',
                fontWeight: 700
              }}
            >
              {total}
            </text>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null
                const d = payload[0].payload as DonutSlice
                return (
                  <div className='bg-popover rounded-lg border px-3 py-2 text-xs shadow-md'>
                    <p className='font-semibold'>{d.label}</p>
                    <p className='text-muted-foreground'>
                      {fmt(d.value)}{' '}
                      <span className='tabular-nums'>
                        ({pct(d.value, total)}%)
                      </span>
                    </p>
                  </div>
                )
              }}
            />
          </PieChart>
        </ChartContainer>
        <div className='flex min-w-0 flex-col gap-1.5'>
          {slices.map((d) => (
            <div key={d.name} className='flex items-center gap-2 text-xs'>
              <span
                className='inline-block size-2 shrink-0 rounded-full'
                style={{ background: d.color }}
              />
              <span className='text-muted-foreground truncate'>{d.label}</span>
              <span className='ml-auto shrink-0 pl-3 font-mono font-semibold tabular-nums'>
                {fmt(d.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Jenjang Donut ───────────────────────────────────────────────────────────

const jenjangConfig = {
  ab1: { label: 'AB 1', color: COLORS.ab1 },
  ab2: { label: 'AB 2', color: COLORS.ab2 },
  ab3: { label: 'AB 3', color: COLORS.ab3 }
} satisfies ChartConfig

const KaderJenjangDonut = ({ data }: { data: KaderBentoStatsData }) => (
  <KaderDonut
    title='Jenjang'
    config={jenjangConfig}
    slices={[
      {
        name: 'ab1',
        label: 'AB 1 — Anggota Biasa Tingkat 1',
        value: data.ab1,
        color: COLORS.ab1
      },
      {
        name: 'ab2',
        label: 'AB 2 — Anggota Biasa Tingkat 2',
        value: data.ab2,
        color: COLORS.ab2
      },
      {
        name: 'ab3',
        label: 'AB 3 — Anggota Biasa Tingkat 3',
        value: data.ab3,
        color: COLORS.ab3
      }
    ]}
  />
)

// ─── Gender Donut ────────────────────────────────────────────────────────────

const genderConfig = {
  ikhwan: { label: 'Ikhwan', color: COLORS.ikhwan },
  akhwat: { label: 'Akhwat', color: COLORS.akhwat }
} satisfies ChartConfig

const KaderGenderDonut = ({ data }: { data: KaderBentoStatsData }) => (
  <KaderDonut
    title='Gender'
    config={genderConfig}
    slices={[
      {
        name: 'ikhwan',
        label: 'Ikhwan',
        value: data.ikhwan,
        color: COLORS.ikhwan
      },
      {
        name: 'akhwat',
        label: 'Akhwat',
        value: data.akhwat,
        color: COLORS.akhwat
      }
    ]}
  />
)

// ─── Perangkat (stat pair — no chart for 2 values) ───────────────────────────

const KaderPerangkatCard = ({ data }: { data: KaderBentoStatsData }) => (
  <div className='bg-card flex h-full flex-col rounded-xl border p-5'>
    <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
      Perangkat Kaderisasi
    </p>
    <div className='mt-4 flex flex-1 flex-col justify-center gap-4'>
      <div className='flex items-center gap-3'>
        <span className='inline-block size-2.5 shrink-0 rounded-full bg-[var(--chart-pemandu)]' />
        <span className='text-muted-foreground flex-1 text-sm'>
          <abbr
            title='Pemandu: fasilitator pelatihan kaderisasi'
            className='cursor-default no-underline'
          >
            Pemandu
          </abbr>
        </span>
        <span className='text-foreground font-mono text-xl font-bold tabular-nums'>
          {fmt(data.pemandu)}
        </span>
      </div>
      <div className='flex items-center gap-3'>
        <span className='inline-block size-2.5 shrink-0 rounded-full bg-[var(--chart-instruktur)]' />
        <span className='text-muted-foreground flex-1 text-sm'>
          <abbr
            title='Instruktur: pengajar materi kaderisasi bersertifikat'
            className='cursor-default no-underline'
          >
            Instruktur
          </abbr>
        </span>
        <span className='text-foreground font-mono text-xl font-bold tabular-nums'>
          {fmt(data.instruktur)}
        </span>
      </div>
    </div>
  </div>
)

// ─── Org Ranked List (PW / PD) ───────────────────────────────────────────────
// Pure CSS ranked list dengan stacked inline bar — total + breakdown AB1/AB2/AB3.
// Tidak pakai Recharts: height predictable, label tidak terpotong, accessible.

type OrgRankedListProps = {
  title: string
  data: MemberOrgDistributionResult[]
  emptyMessage: string
}

const KaderOrgRankedList = ({
  title,
  data,
  emptyMessage
}: OrgRankedListProps) => {
  if (!data || data.length === 0) {
    return (
      <div className='bg-card flex h-full flex-col rounded-xl border p-5'>
        <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          {title}
        </p>
        <p className='text-muted-foreground mt-3 text-sm'>{emptyMessage}</p>
      </div>
    )
  }

  const maxTotal = Math.max(...data.map((d) => d.total), 1)

  return (
    <div className='bg-card flex flex-col rounded-xl border p-5'>
      <div className='flex items-center justify-between'>
        <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          {title}
        </p>
        <div className='text-muted-foreground flex items-center gap-3 text-[10px]'>
          <span className='flex items-center gap-1'>
            <span className='inline-block size-1.5 rounded-full bg-[var(--chart-ab1)]' />
            <abbr
              title='Anggota Biasa Tingkat 1'
              className='cursor-default tracking-wider uppercase no-underline'
            >
              AB1
            </abbr>
          </span>
          <span className='flex items-center gap-1'>
            <span className='inline-block size-1.5 rounded-full bg-[var(--chart-ab2)]' />
            <abbr
              title='Anggota Biasa Tingkat 2'
              className='cursor-default tracking-wider uppercase no-underline'
            >
              AB2
            </abbr>
          </span>
          <span className='flex items-center gap-1'>
            <span className='inline-block size-1.5 rounded-full bg-[var(--chart-ab3)]' />
            <abbr
              title='Anggota Biasa Tingkat 3'
              className='cursor-default tracking-wider uppercase no-underline'
            >
              AB3
            </abbr>
          </span>
        </div>
      </div>

      <TooltipProvider>
        <div className='mt-3 flex flex-col gap-2.5'>
          {data.map((org, i) => {
            const ab1W = pct(org.ab1, maxTotal)
            const ab2W = pct(org.ab2, maxTotal)
            const ab3W = pct(org.ab3, maxTotal)

            return (
              <UITooltip key={org.organizationId}>
                <TooltipTrigger className='flex cursor-default items-center gap-3'>
                  <span className='text-muted-foreground/50 w-4 shrink-0 text-right font-mono text-[10px] tabular-nums'>
                    {i + 1}
                  </span>
                  <span className='text-foreground w-28 shrink-0 truncate text-left text-xs'>
                    {shortName(org.organizationName)}
                  </span>
                  <div className='bg-muted flex h-2 flex-1 overflow-hidden rounded-full'>
                    <div
                      className='h-full bg-[var(--chart-ab1)] transition-all'
                      style={{ width: `${ab1W}%` }}
                    />
                    <div
                      className='h-full bg-[var(--chart-ab2)] transition-all'
                      style={{ width: `${ab2W}%` }}
                    />
                    <div
                      className='h-full bg-[var(--chart-ab3)] transition-all'
                      style={{ width: `${ab3W}%` }}
                    />
                  </div>
                  <span className='text-foreground w-7 shrink-0 text-right font-mono text-xs font-semibold tabular-nums'>
                    {fmt(org.total)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side='top'>
                  <p className='font-semibold'>{org.organizationName}</p>
                  <p className='mt-1 font-mono text-[10px] opacity-80'>
                    Total {fmt(org.total)} · AB1 {fmt(org.ab1)} · AB2{' '}
                    {fmt(org.ab2)} · AB3 {fmt(org.ab3)}
                  </p>
                </TooltipContent>
              </UITooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </div>
  )
}

// ─── Main Bento ──────────────────────────────────────────────────────────────

export const KaderBentoStats = ({
  data,
  pwDistribution,
  pdDistribution
}: KaderBentoStatsProps) => {
  if (data.total === 0) {
    return (
      <div className='bg-card flex flex-col gap-3 rounded-xl border p-6'>
        <p className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          Kader Aktif
        </p>
        <p className='text-muted-foreground text-sm'>
          Belum ada kader terdaftar dalam scope organisasi ini.
        </p>
        <Link
          href='/dashboard/kader'
          className='text-primary focus-visible:ring-ring inline-flex min-h-11 items-center gap-1 text-sm font-medium hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
        >
          Tambah kader pertama →
        </Link>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-3 gap-3'>
      {/* Row 1: Jenjang | Gender | Total */}
      <div className='col-span-3 sm:col-span-1'>
        <KaderJenjangDonut data={data} />
      </div>
      <div className='col-span-3 sm:col-span-1'>
        <KaderGenderDonut data={data} />
      </div>
      <div className='col-span-3 sm:col-span-1'>
        <KaderTotalCard data={data} />
      </div>

      {/* Row 2: Perangkat (1/3) | PW (2/3) */}
      <div className='col-span-3 sm:col-span-1'>
        <KaderPerangkatCard data={data} />
      </div>
      <div className='col-span-3 sm:col-span-2'>
        <KaderOrgRankedList
          title='Per PW'
          data={pwDistribution}
          emptyMessage='Belum ada data distribusi per PW.'
        />
      </div>

      {/* Row 3: PD full width */}
      <div className='col-span-3'>
        <KaderOrgRankedList
          title='Per PD'
          data={pdDistribution}
          emptyMessage='Belum ada data distribusi per PD.'
        />
      </div>
    </div>
  )
}
