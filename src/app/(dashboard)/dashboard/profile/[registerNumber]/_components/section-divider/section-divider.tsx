import { Separator } from '~/components/shadcn/ui/separator'

interface SectionDividerProps {
  title: string
  count?: number
}

export const SectionDivider = ({ title, count }: SectionDividerProps) => (
  <div className='mt-6 mb-1 first:mt-0'>
    <div className='flex items-center gap-2'>
      <h2 className='text-foreground/60 font-geist-mono text-[11px] font-medium tracking-widest uppercase'>
        {title}
      </h2>
      {count !== undefined && count > 0 && (
        <span className='font-geist-mono text-muted-foreground/60 text-xs'>
          ({count})
        </span>
      )}
    </div>
    <Separator className='mt-2' />
  </div>
)
