'use client'

import { Database01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

interface EmptyStateProps {
  title: string
  description: string
}

export const EmptyState = ({ title, description }: EmptyStateProps) => {
  return (
    <div className='flex flex-col items-center justify-center py-20 text-center'>
      <div className='mb-4 rounded-full bg-muted p-4'>
        <HugeiconsIcon
          icon={Database01Icon}
          strokeWidth={1.5}
          className='size-10 text-muted-foreground opacity-50'
        />
      </div>
      <h3 className='text-lg font-semibold text-foreground'>{title}</h3>
      <p className='max-w-xs text-sm text-muted-foreground'>{description}</p>
    </div>
  )
}
