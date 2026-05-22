import Link from 'next/link'
import { buttonVariants } from '~/components/shadcn/ui/button/button'
import { cn } from '~/lib/shadcn/utils'

const STATS = [
  { value: '38', label: 'Wilayah / Provinsi', suffix: '' },
  { value: '300', label: 'Daerah / Kabupaten', suffix: '+' },
  { value: '1.000', label: 'Komisariat / Kampus', suffix: '+' },
  { value: '50k', label: 'Kader Aktif', suffix: '+' }
]

export const NetworkSection = () => {
  return (
    <section
      className='bg-muted/40 py-20 lg:py-28'
      aria-labelledby='network-heading'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h2
            id='network-heading'
            className='font-heading text-[clamp(1.5rem,3vw,2rem)] font-bold text-foreground'
          >
            Peta Jaringan Nasional
          </h2>
          <div className='mx-auto mt-1 h-1 w-12 rounded-full bg-primary' aria-hidden='true' />
          <p className='mt-4 font-sans text-sm text-muted-foreground'>
            Dari Sabang sampai Merauke, jaringan KAMMI hadir untuk mendukung
            agenda kebangsaan dari level kampus.
          </p>
        </div>

        <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className='rounded-2xl border border-border bg-background p-6 text-center'
            >
              <p className='font-heading text-[clamp(2rem,5vw,3rem)] font-bold leading-none text-foreground'>
                {stat.value}
                <span className='text-primary'>{stat.suffix}</span>
              </p>
              <p className='mt-2 font-sans text-xs font-medium text-muted-foreground'>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className='mt-10 flex justify-center'>
          <Link href='/dashboard' className={cn(buttonVariants())}>
            Cari Pengurus Daerah
          </Link>
        </div>
      </div>
    </section>
  )
}
