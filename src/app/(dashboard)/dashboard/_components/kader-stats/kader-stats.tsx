import Link from 'next/link'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { fmt } from '~/lib/utils/format'
import { Separator } from '~/components/shadcn/ui/separator'

export type KaderStatsData = {
  total: number
  ab1: number
  ab2: number
  ab3: number
  ikhwan: number
  akhwat: number
  pemandu: number
  instruktur: number
  alumni: number
}

const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100)

const StatSplit = ({
  label,
  value,
  dim
}: {
  label: string
  value: number
  dim?: boolean
}) => (
  <div className={dim ? 'opacity-60' : ''}>
    <div className='font-mono text-base font-semibold tabular-nums'>
      {fmt(value)}
    </div>
    <div className='text-muted-foreground text-xs uppercase tracking-wider'>
      {label}
    </div>
  </div>
)

export const KaderStats = ({ data }: { data: KaderStatsData }) => {
  const { total, ab1, ab2, ab3, ikhwan, akhwat, pemandu, instruktur, alumni } =
    data
  const isEmpty = total === 0

  const ab1Pct = pct(ab1, total)
  const ab2Pct = pct(ab2, total)
  const ab3Pct = pct(ab3, total)

  if (isEmpty) {
    return (
      <div className='flex flex-col gap-3 rounded-xl border bg-card p-6'>
        <div className='text-sm font-medium tracking-tight text-muted-foreground uppercase'>
          Kader Aktif
        </div>
        <p className='text-muted-foreground text-sm'>
          Belum ada kader terdaftar dalam scope organisasi ini.
        </p>
        <Link
          href='/dashboard/kader'
          className='inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline'
        >
          Tambah kader pertama
          <HugeiconsIcon icon={ArrowRight01Icon} className='size-3.5' />
        </Link>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-5 rounded-xl border bg-card p-6'>
      {/* Header */}
      <div className='flex items-start justify-between gap-4'>
        <div>
          <div className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
            Kader Aktif
          </div>
          <div className='mt-1 font-mono text-4xl font-bold tabular-nums tracking-tight text-foreground'>
            {fmt(total)}
          </div>
        </div>
        <div className='flex gap-6 pt-1'>
          <StatSplit label='Ikhwan' value={ikhwan} />
          <StatSplit label='Akhwat' value={akhwat} />
        </div>
      </div>

      {/* AB Breakdown bar */}
      <div className='flex flex-col gap-2'>
        <div
          className='flex h-2 w-full overflow-hidden rounded-full'
          aria-label={`AB1: ${ab1Pct}%, AB2: ${ab2Pct}%, AB3: ${ab3Pct}%`}
          style={
            {
              '--w-ab1': `${ab1Pct}%`,
              '--w-ab2': `${ab2Pct}%`,
              '--w-ab3': `${ab3Pct}%`
            } as React.CSSProperties
          }
        >
          <div className='bg-primary h-full w-[var(--w-ab1)] transition-all' />
          <div className='bg-primary/50 h-full w-[var(--w-ab2)] transition-all' />
          <div className='bg-primary/20 h-full w-[var(--w-ab3)] transition-all' />
        </div>
        <div className='flex gap-5'>
          <div className='flex items-center gap-1.5'>
            <span className='inline-block size-2 rounded-full bg-primary' />
            <span className='font-mono text-xs font-medium tabular-nums'>
              {fmt(ab1)}
            </span>
            <abbr
              title='Anggota Biasa Tingkat 1'
              className='cursor-default text-xs text-muted-foreground no-underline'
            >
              AB 1
            </abbr>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='inline-block size-2 rounded-full bg-primary/50' />
            <span className='font-mono text-xs font-medium tabular-nums'>
              {fmt(ab2)}
            </span>
            <abbr
              title='Anggota Biasa Tingkat 2'
              className='cursor-default text-xs text-muted-foreground no-underline'
            >
              AB 2
            </abbr>
          </div>
          <div className='flex items-center gap-1.5'>
            <span className='inline-block size-2 rounded-full bg-primary/20' />
            <span className='font-mono text-xs font-medium tabular-nums'>
              {fmt(ab3)}
            </span>
            <abbr
              title='Anggota Biasa Tingkat 3'
              className='cursor-default text-xs text-muted-foreground no-underline'
            >
              AB 3
            </abbr>
          </div>
        </div>
      </div>

      <Separator />

      {/* Secondary stats */}
      <div className='grid grid-cols-3 gap-4'>
        <StatSplit label='Pemandu' value={pemandu} dim={pemandu === 0} />
        <StatSplit label='Instruktur' value={instruktur} dim={instruktur === 0} />
        <StatSplit label='Alumni' value={alumni} dim={alumni === 0} />
      </div>
    </div>
  )
}
