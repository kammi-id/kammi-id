'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { cn } from '~/lib/shadcn/utils'

export const UnsavedChangesBanner = ({
  isDirty,
  className
}: {
  isDirty: boolean
  className?: string
}) => {
  if (!isDirty) return null

  return (
    <div
      role='status'
      aria-live='polite'
      className={cn(
        'bg-background border-border flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm',
        className
      )}
    >
      <HugeiconsIcon
        icon={InformationCircleIcon}
        className='text-muted-foreground size-4 shrink-0'
        strokeWidth={2}
      />
      <span className='text-muted-foreground'>Ada perubahan belum disimpan.</span>
    </div>
  )
}
