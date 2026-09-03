'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Alert01Icon } from '@hugeicons/core-free-icons'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '~/components/shadcn/ui/tooltip'

interface WarningTooltipProps {
  message: string
}

export const WarningTooltip = ({ message }: WarningTooltipProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger
        className='inline-flex cursor-default'
        aria-label={message}
      >
        <HugeiconsIcon
          icon={Alert01Icon}
          className='size-3.5 text-[var(--status-warning-icon)]'
        />
      </TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
)
