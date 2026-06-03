'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useStore } from '@nanostores/react'
import { cn } from '~/lib/shadcn/utils'
import { useLenisScroll } from '~/components/lenis-provider'
import { $tentangPhase, $tentangPhaseScrollY } from '../tentang-scene/store'

const PHASE_LABELS = ['Visi', 'Misi', 'Prinsip', 'Paradigma', 'Kredo'] as const

export const SectionNav = () => {
  const portalRef = useRef<HTMLElement | null>(null)
  const [mounted, setMounted] = useState(false)
  const { scrollTo } = useLenisScroll()
  const activePhase = useStore($tentangPhase)
  const phaseScrollY = useStore($tentangPhaseScrollY)

  useEffect(() => {
    // Dedicated container decouples this nav from any SSR-rendered body children.
    // React treats it as a purely client-side subtree — no hydration mismatch.
    const el = document.createElement('div')
    el.setAttribute('data-tentang-nav', '')
    document.body.appendChild(el)
    portalRef.current = el
    setMounted(true)
    return () => {
      document.body.removeChild(el)
      portalRef.current = null
    }
  }, [])

  const handleScrollToPhase = (i: number) => {
    const scrollY = phaseScrollY[i]
    if (scrollY !== undefined && scrollY >= 0) scrollTo(scrollY)
  }

  const visible = activePhase >= 0

  if (!mounted || !portalRef.current) return null

  return createPortal(
    <nav
      className={cn(
        'fixed top-1/2 right-6 z-[100] -translate-y-1/2 transition-opacity duration-500',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      aria-label='Navigasi fase'
    >
      {/* Phase counter — shows current position in the journey */}
      <div className='mb-2 flex justify-center'>
        <span className='font-mono text-[0.6rem] tabular-nums text-foreground/35'>
          {activePhase + 1}
          <span className='text-foreground/20'>/5</span>
        </span>
      </div>
      <ol className='flex flex-col items-center gap-1'>
        {PHASE_LABELS.map((label, i) => {
          const isActive = activePhase === i
          return (
            <li key={label}>
              <button
                onClick={() => handleScrollToPhase(i)}
                aria-label={`Ke fase ${label}`}
                className='group relative flex min-h-[44px] min-w-[44px] items-center justify-center'
              >
                <span
                  className={cn(
                    'block rounded-full transition-all duration-300',
                    isActive
                      ? 'bg-primary size-2.5'
                      : 'bg-foreground/25 group-hover:bg-foreground/50 size-1.5'
                  )}
                />
                <span className='bg-foreground text-background pointer-events-none absolute right-full mr-3 rounded px-2 py-0.5 font-sans text-xs whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100'>
                  {label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>,
    portalRef.current
  )
}
