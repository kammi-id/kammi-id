import { useId, type ReactNode } from 'react'
import { Separator } from '~/components/shadcn/ui/separator'

type FooterFormSectionProps = {
  index: string
  title: string
  description: string
  children: ReactNode
}

/** One card of the footer settings, styled like the Halaman Utama sections. */
export const FooterFormSection = ({
  index,
  title,
  description,
  children
}: FooterFormSectionProps) => {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className='border-border rounded-3xl border bg-white shadow-xs'
    >
      <div className='border-b px-6 py-5'>
        <div className='flex items-start gap-3'>
          <span className='text-muted-foreground mt-0.5 font-mono text-xs'>
            {index}
          </span>
          <Separator orientation='vertical' className='mt-0.5 h-3.5' />
          <div>
            <h2
              id={titleId}
              className='text-foreground text-base font-semibold'
            >
              {title}
            </h2>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              {description}
            </p>
          </div>
        </div>
      </div>
      <div className='px-6 py-6'>{children}</div>
    </section>
  )
}
