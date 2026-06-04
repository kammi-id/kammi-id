import { cn } from '~/lib/shadcn/utils'

interface TierSummaryProps {
  data: {
    type: string
    count: number
    totalMembers: number
  }[]
}

export const TierSummary = ({ data }: TierSummaryProps) => {
  const labels: Record<string, string> = {
    pp: 'Pusat',
    pw: 'Wilayah',
    pd: 'Daerah',
    pdln: 'Daerah LN',
    pk: 'Komisariat'
  }

  const colors: Record<string, string> = {
    pp: '[color:var(--org-pp-text)] [background:var(--org-pp-bg)] [border-color:var(--org-pp-border)]',
    pw: 'text-primary bg-primary/5 border-primary/20',
    pd: '[color:var(--org-pd-text)] [background:var(--org-pd-bg)] [border-color:var(--org-pd-border)]',
    pdln: '[color:var(--org-pd-text)] [background:var(--org-pd-bg)] [border-color:var(--org-pd-border)]',
    pk: '[color:var(--org-pk-text)] [background:var(--org-pk-bg)] [border-color:var(--org-pk-border)]'
  }

  return (
    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5'>
      {data.map((tier) => (
        <div
          key={tier.type}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border p-3 transition-all hover:shadow-sm',
            colors[tier.type] || 'bg-muted border-border'
          )}
        >
          <span className='text-[10px] font-bold tracking-wider uppercase opacity-80'>
            {labels[tier.type] || tier.type}
          </span>
          <div className='mt-1 flex items-baseline gap-1'>
            <span className='text-xl leading-none font-bold'>{tier.count}</span>
            <span className='text-[10px] font-medium opacity-70'>Org</span>
          </div>
          <div className='mt-1 text-[10px] font-medium opacity-90'>
            {tier.totalMembers.toLocaleString()} Kader
          </div>
        </div>
      ))}
    </div>
  )
}
