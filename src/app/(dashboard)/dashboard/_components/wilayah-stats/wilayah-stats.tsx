import Link from 'next/link'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

export type WilayahStatsData = {
  pw: number
  pd: number
  pk: number
}

const fmt = (n: number) => n.toLocaleString('id-ID')

export const WilayahStats = ({ data }: { data: WilayahStatsData }) => {
  const { pw, pd, pk } = data
  const isEmpty = pw === 0 && pd === 0 && pk === 0

  if (isEmpty) {
    return (
      <div className='flex flex-col gap-3 rounded-xl border bg-card p-6'>
        <div className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
          Cakupan Organisasi
        </div>
        <p className='text-muted-foreground text-sm'>
          Belum ada data wilayah dalam scope organisasi ini.
        </p>
        <Link
          href='/dashboard/branches'
          className='inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline'
        >
          Kelola wilayah
          <HugeiconsIcon icon={ArrowRight01Icon} className='size-3.5' />
        </Link>
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-5 rounded-xl border bg-card p-6'>
      <div className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
        Cakupan Organisasi
      </div>

      <div className='grid grid-cols-3 gap-6'>
        <div>
          <div className='font-mono text-3xl font-bold tabular-nums tracking-tight text-foreground'>
            {fmt(pw)}
          </div>
          <div className='mt-1 text-xs text-muted-foreground'>
            Pengurus Wilayah
          </div>
        </div>
        <div>
          <div className='font-mono text-3xl font-bold tabular-nums tracking-tight text-foreground'>
            {fmt(pd)}
          </div>
          <div className='mt-1 text-xs text-muted-foreground'>Daerah</div>
        </div>
        <div>
          <div className='font-mono text-3xl font-bold tabular-nums tracking-tight text-foreground'>
            {fmt(pk)}
          </div>
          <div className='mt-1 text-xs text-muted-foreground'>Komisariat</div>
        </div>
      </div>

      <Link
        href='/dashboard/branches'
        className='inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors'
      >
        Lihat semua wilayah
        <HugeiconsIcon icon={ArrowRight01Icon} className='size-3' />
      </Link>
    </div>
  )
}
