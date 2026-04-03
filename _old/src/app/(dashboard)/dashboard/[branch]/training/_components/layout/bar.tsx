import type { JSX, ComponentPropsWithoutRef as ComponentProps } from 'react'
import { cn } from '~/lib/shadcn/utils'

type TrainingBarProps = ComponentProps<'div'>

const TrainingBar = ({
  children,
  className,
  ...props
}: TrainingBarProps): JSX.Element => {
  return (
    <div
      className={cn(
        'border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 flex items-center justify-end gap-4 border-b px-6 py-4 backdrop-blur',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default TrainingBar
