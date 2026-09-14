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
      <div className='bg-card flex flex-col gap-3 rounded-xl border p-6'>
        <h2 className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          Cakupan Organisasi
        </h2>
        <p className='text-muted-foreground text-sm'>
          Belum ada data wilayah dalam scope organisasi ini.
        </p>
        <Link
          href='/dashboard/branches'
          className='text-primary focus-visible:ring-ring inline-flex min-h-11 items-center gap-1 text-sm font-medium hover:underline focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none'
        >
          Kelola wilayah
          <HugeiconsIcon icon={ArrowRight01Icon} className='size-3.5' />
        </Link>
      </div>
    )
  }

  return (
    <div className='bg-card flex flex-col gap-5 rounded-xl border p-6'>
      <h2 className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
        Cakupan Organisasi
      </h2>

      <div className='grid grid-cols-3 gap-6'>
        <div>
          <div className='text-foreground font-mono text-3xl font-bold tracking-tight tabular-nums'>
            {fmt(pw)}
          </div>
          <div className='text-muted-foreground mt-1 text-xs'>
            Pengurus Wilayah
          </div>
        </div>
        <div>
          <div className='text-foreground font-mono text-3xl font-bold tracking-tight tabular-nums'>
            {fmt(pd)}
          </div>
          <div className='text-muted-foreground mt-1 text-xs'>Daerah</div>
        </div>
        <div>
          <div className='text-foreground font-mono text-3xl font-bold tracking-tight tabular-nums'>
            {fmt(pk)}
          </div>
          <div className='text-muted-foreground mt-1 text-xs'>Komisariat</div>
        </div>
      </div>

      <Link
        href='/dashboard/branches'
        className='text-muted-foreground hover:text-primary focus-visible:ring-ring inline-flex min-h-11 items-center gap-1 text-xs transition-colors focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none'
      >
        Lihat semua wilayah
        <HugeiconsIcon icon={ArrowRight01Icon} className='size-3' />
      </Link>
    </div>
  )
}
