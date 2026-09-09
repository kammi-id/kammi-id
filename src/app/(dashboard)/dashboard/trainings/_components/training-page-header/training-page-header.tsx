import { HugeiconsIcon } from '@hugeicons/react'
import { WhiteboardIcon } from '@hugeicons/core-free-icons'

interface TrainingPageHeaderProps {
  pageTitle: string
  subTitle: string
}

export const TrainingPageHeader = ({
  pageTitle,
  subTitle
}: TrainingPageHeaderProps) => {
  return (
    <div className='flex items-center gap-6'>
      <div className='bg-primary/10 text-primary ring-primary/5 flex size-14 shrink-0 items-center justify-center rounded-full ring-4'>
        <HugeiconsIcon
          icon={WhiteboardIcon}
          strokeWidth={2}
          className='size-7'
        />
      </div>
      <div>
        <h1 className='font-heading text-3xl font-extrabold tracking-tight sm:text-4xl'>
          {pageTitle}
        </h1>
        <p className='text-muted-foreground max-w-2xl leading-relaxed'>
          {subTitle}
        </p>
      </div>
    </div>
  )
}
