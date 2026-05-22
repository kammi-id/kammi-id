import Link from 'next/link'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Badge } from '~/components/shadcn/ui/badge'
import { cn } from '~/lib/shadcn/utils'
import type { UpcomingTraining } from '~/app/(dashboard)/dashboard/_data/trainings'

const typeLabels: Record<string, string> = {
  dm1: 'DM 1',
  dm2: 'DM 2',
  dpmk: 'DPMK',
  tfi: 'TFI',
  dm3: 'DM 3',
  other: 'Lainnya'
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

export const UpcomingTrainings = ({
  data
}: {
  data: UpcomingTraining[]
}) => {
  return (
    <div className='flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-base font-semibold tracking-tight'>
            Dauroh Terdekat
          </h2>
          <p className='text-xs text-muted-foreground'>
            10 dauroh yang akan datang dalam scope organisasi
          </p>
        </div>
        <Link
          href='/dashboard/trainings'
          className='inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline'
        >
          Semua dauroh
          <HugeiconsIcon icon={ArrowRight01Icon} className='size-3' />
        </Link>
      </div>

      <div className='overflow-hidden rounded-xl border bg-card'>
        {data.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-2 py-12 text-center'>
            <p className='text-sm font-medium text-muted-foreground'>
              Tidak ada dauroh yang akan datang.
            </p>
            <Link
              href='/dashboard/trainings'
              className='inline-flex items-center gap-1 text-xs text-primary hover:underline'
            >
              Tambah dauroh baru
              <HugeiconsIcon icon={ArrowRight01Icon} className='size-3' />
            </Link>
          </div>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b bg-muted/50'>
                <th className='h-10 px-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Nama Dauroh
                </th>
                <th className='h-10 px-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Organisasi
                </th>
                <th className='h-10 px-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Tipe
                </th>
                <th className='h-10 px-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell'>
                  ID
                </th>
                <th className='h-10 px-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground hidden md:table-cell'>
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((training, idx) => (
                <tr
                  key={training.id}
                  className={cn(
                    'transition-colors hover:bg-muted/40',
                    idx < data.length - 1 && 'border-b'
                  )}
                >
                  <td className='px-4 py-3 font-medium'>
                    <Link
                      href={`/dashboard/trainings/${training.organization.codeSlug}/${training.year}/${training.identifier}`}
                      className='hover:text-primary hover:underline transition-colors'
                    >
                      {training.name}
                    </Link>
                  </td>
                  <td className='px-4 py-3 text-muted-foreground text-xs'>
                    {training.organization.name}
                  </td>
                  <td className='px-4 py-3'>
                    <Badge
                      variant='outline'
                      className='bg-primary/10 text-primary border-primary/20 font-bold text-xs'
                    >
                      {typeLabels[training.type] ?? training.type}
                    </Badge>
                  </td>
                  <td className='px-4 py-3 hidden sm:table-cell'>
                    <span className='font-mono text-xs text-muted-foreground/70'>
                      {training.year}-{training.identifier}
                    </span>
                  </td>
                  <td className='px-4 py-3 text-xs text-muted-foreground hidden md:table-cell'>
                    {formatDate(training.startDate)} &ndash;{' '}
                    {formatDate(training.endDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
