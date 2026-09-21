'use client'

import { useId, useRef, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'

export const PublicationRow = ({
  children,
  label
}: {
  children: ReactNode
  label: string
}) => {
  const row = useRef<HTMLDivElement>(null)
  const id = useId()
  const move = (direction: number) => {
    if (!row.current) return
    row.current.scrollBy({
      left: direction * row.current.clientWidth,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth'
    })
  }
  return (
    <div className='mt-6'>
      <div
        id={id}
        ref={row}
        role='region'
        aria-label={label}
        tabIndex={0}
        data-lenis-prevent
        className='focus-visible:outline-ring grid snap-x snap-mandatory auto-cols-[100%] grid-flow-col gap-6 overflow-x-auto overscroll-x-contain rounded-3xl pb-4 focus-visible:outline-2 md:auto-cols-[calc((100%-1.5rem)/2)] lg:auto-cols-[calc((100%-3rem)/3)] [&>*]:min-w-0 [&>*]:snap-start'
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault()
            move(event.key === 'ArrowRight' ? 1 : -1)
          }
        }}
      >
        {children}
      </div>
      <div className='mt-2 flex justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          size='icon'
          aria-controls={id}
          aria-label={`${label}: sebelumnya`}
          onClick={() => move(-1)}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} />
        </Button>
        <Button
          type='button'
          variant='outline'
          size='icon'
          aria-controls={id}
          aria-label={`${label}: berikutnya`}
          onClick={() => move(1)}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} />
        </Button>
      </div>
    </div>
  )
}
