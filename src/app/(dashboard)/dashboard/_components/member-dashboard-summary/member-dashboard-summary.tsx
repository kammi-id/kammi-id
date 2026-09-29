import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Badge } from '~/components/shadcn/ui/badge'
import { Separator } from '~/components/shadcn/ui/separator'
import { kaderJenjangLabel } from '~/lib/kader/jenjang'
import { keadaanKaderLabel } from '~/lib/kader/keadaan-kader'
import { trainingTypeLabel } from '~/lib/daurah/labels'
import type { MemberDashboardSummaryProps } from './types'

const InfoRow = ({
  label,
  value
}: {
  label: string
  value: React.ReactNode
}) => (
  <div className='flex items-center justify-between py-2'>
    <span className='text-muted-foreground text-sm'>{label}</span>
    <span className='text-foreground text-sm font-medium'>{value}</span>
  </div>
)

export const MemberDashboardSummary = ({
  registerNumber,
  orgChain,
  status,
  yearOfEntry,
  keadaan,
  trainingHistory,
  isCertifiedMentor,
  isCertifiedInstructor
}: MemberDashboardSummaryProps) => {
  const hasPerangkatCertification = isCertifiedMentor || isCertifiedInstructor

  return (
    <div className='border-border w-full max-w-sm rounded-2xl border p-4'>
      <div>
        <InfoRow
          label='Struktur'
          value={orgChain.map((org) => org.name).join(' / ')}
        />
        <InfoRow label='Jenjang Kaderisasi' value={kaderJenjangLabel(status)} />
        <InfoRow label='Tahun Masuk' value={yearOfEntry} />
        <InfoRow label='Keadaan' value={keadaanKaderLabel[keadaan]} />
      </div>

      <Separator className='my-3' />

      <div>
        <h2 className='text-muted-foreground font-geist-mono mb-2 text-[11px] font-medium tracking-widest uppercase'>
          Riwayat Daurah
        </h2>
        {trainingHistory.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            Belum ada riwayat daurah.
          </p>
        ) : (
          <div className='divide-border/60 divide-y'>
            {trainingHistory.map((record) => (
              <div
                key={record.id}
                className='flex items-center justify-between gap-2 py-2'
              >
                <div className='min-w-0 flex-1'>
                  <p className='text-foreground truncate text-sm font-medium'>
                    {record.name}
                  </p>
                  {record.organizationName && (
                    <p className='text-muted-foreground truncate text-xs'>
                      {record.organizationName}
                    </p>
                  )}
                </div>
                <div className='flex shrink-0 items-center gap-1.5'>
                  <span className='font-geist-mono text-muted-foreground text-xs'>
                    {trainingTypeLabel(record.type)}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {record.year}
                  </span>
                  <HugeiconsIcon
                    icon={record.isPassing ? Tick01Icon : Cancel01Icon}
                    aria-label={record.isPassing ? 'Lulus' : 'Tidak Lulus'}
                    className='size-3.5 shrink-0'
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasPerangkatCertification && (
        <>
          <Separator className='my-3' />
          <div>
            <h2 className='text-muted-foreground font-geist-mono mb-2 text-[11px] font-medium tracking-widest uppercase'>
              Perangkat
            </h2>
            <div className='flex flex-wrap gap-1.5'>
              {isCertifiedMentor && <Badge variant='outline'>Pemandu</Badge>}
              {isCertifiedInstructor && (
                <Badge variant='outline'>Instruktur</Badge>
              )}
            </div>
          </div>
        </>
      )}

      <Separator className='my-3' />

      <Link
        href={`/dashboard/profile/${registerNumber}`}
        className='text-primary text-sm font-medium hover:underline'
      >
        Lihat profil lengkap
      </Link>
    </div>
  )
}
