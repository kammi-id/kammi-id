import Image from 'next/image'
import { Badge } from '~/components/shadcn/ui/badge'
import { kaderJenjangLabel } from '~/lib/kader/jenjang'
import { keadaanKaderLabel } from '~/lib/kader/keadaan-kader'
import type { KartuTandaAnggotaProps } from './types'

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Ratio 85.6×54mm (ADR 0029) so the on-screen card matches what ticket 05
 * prints. No QR code and no reserved space for one — verification (ticket
 * 07) is undecided, and an empty box would promise something not yet true.
 */
export const KartuTandaAnggota = ({
  name,
  registerNumber,
  photoUrl,
  organizationName,
  status,
  yearOfEntry,
  keadaan
}: KartuTandaAnggotaProps) => (
  <div className='bg-card text-card-foreground border-border relative flex aspect-[85.6/54] w-full max-w-sm flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-sm'>
    {keadaan !== 'aktif' && (
      <Badge
        variant={keadaan === 'sanksi' ? 'destructive' : 'secondary'}
        className='absolute top-3 right-3'
      >
        {keadaanKaderLabel[keadaan]}
      </Badge>
    )}

    <div className='flex items-center gap-3'>
      <div className='bg-border text-muted-foreground ring-border relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2'>
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={`Foto ${name}`}
            fill
            sizes='56px'
            className='object-cover'
          />
        ) : (
          <span className='font-heading text-sm font-bold select-none'>
            {getInitials(name)}
          </span>
        )}
      </div>
      <div className='min-w-0'>
        <p className='text-foreground truncate text-base font-semibold'>
          {name}
        </p>
        <p className='text-muted-foreground font-geist-mono truncate text-xs tracking-wide'>
          {registerNumber}
        </p>
      </div>
    </div>

    <div className='flex items-end justify-between gap-2'>
      <p className='text-muted-foreground truncate text-sm'>
        {organizationName}
      </p>
      <div className='flex shrink-0 items-center gap-2'>
        <Badge variant='outline'>{kaderJenjangLabel(status)}</Badge>
        <span className='text-muted-foreground font-geist-mono text-xs'>
          {yearOfEntry}
        </span>
      </div>
    </div>
  </div>
)
