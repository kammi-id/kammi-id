import { fmt } from '~/lib/utils/format'

interface SpecialistSummaryCardsProps {
  pemanduCount: number
  instrukturCount: number
}

export const SpecialistSummaryCards = ({
  pemanduCount,
  instrukturCount
}: SpecialistSummaryCardsProps) => {
  return (
    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
      <div className='bg-card flex flex-col gap-2 rounded-xl border p-4'>
        <p className='text-muted-foreground text-xs font-medium'>
          Total Pemandu
        </p>
        <div className='flex flex-1 items-center justify-center py-4'>
          <span className='font-heading text-foreground text-5xl font-extrabold tracking-tight tabular-nums'>
            {fmt(pemanduCount)}
          </span>
        </div>
      </div>
      <div className='bg-card flex flex-col gap-2 rounded-xl border p-4'>
        <p className='text-muted-foreground text-xs font-medium'>
          Total Instruktur
        </p>
        <div className='flex flex-1 items-center justify-center py-4'>
          <span className='font-heading text-foreground text-5xl font-extrabold tracking-tight tabular-nums'>
            {fmt(instrukturCount)}
          </span>
        </div>
      </div>
    </div>
  )
}
