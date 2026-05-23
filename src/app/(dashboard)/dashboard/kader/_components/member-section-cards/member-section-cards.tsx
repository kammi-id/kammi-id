'use client'

const fmt = (n: number) => n.toLocaleString('id-ID')
const pct = (n: number, total: number) =>
  total === 0 ? 0 : Math.round((n / total) * 100)

const Stat = ({
  label,
  value,
  sub
}: {
  label: string
  value: number
  sub?: string
}) => (
  <div className='flex flex-col gap-0.5'>
    <span className='font-mono text-sm font-semibold tabular-nums text-foreground'>
      {fmt(value)}
      {sub && (
        <span className='ml-1 text-xs font-normal text-muted-foreground'>
          {sub}
        </span>
      )}
    </span>
    <span className='text-xs text-muted-foreground'>{label}</span>
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

  const ab1Pct = pct(ab1, total)
  const ab2Pct = pct(ab2, total)
  const ab3Pct = pct(ab3, total)

  return (
    <div className='flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border bg-card px-5 py-4'>
      <Stat label='Total' value={total} />
      {!isAlumni && (
        <>
          <div className='hidden h-6 w-px bg-border sm:block' aria-hidden />
          <Stat label='Ikhwan' value={ikhwan} />
          <Stat label='Akhwat' value={akhwat} />
          <div className='hidden h-6 w-px bg-border sm:block' aria-hidden />
          <Stat
            label='AB 1'
            value={ab1}
            sub={ab1Pct > 0 ? `${ab1Pct}%` : undefined}
          />
          <Stat
            label='AB 2'
            value={ab2}
            sub={ab2Pct > 0 ? `${ab2Pct}%` : undefined}
          />
          <Stat
            label='AB 3'
            value={ab3}
            sub={ab3Pct > 0 ? `${ab3Pct}%` : undefined}
          />
        </>
      )}
    </div>
  )
}
