'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '~/lib/shadcn/utils'
import { useLenisScroll } from '~/components/lenis-provider'

const PHASES = [
  { id: 'tentang-hero', label: 'Hero' },
  { id: 'visi', label: 'Visi' },
  { id: 'misi', label: 'Misi' },
  { id: 'prinsip', label: 'Prinsip' },
  { id: 'paradigma', label: 'Paradigma' },
  { id: 'kredo', label: 'Kredo' }
] as const

export const SectionNav = () => {
  const portalRef = useRef<HTMLElement | null>(null)
  const [mounted, setMounted] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const { scrollTo } = useLenisScroll()

  useEffect(() => {
    const root = document.getElementById('portal-root')
    if (!root) return
    portalRef.current = root
    setMounted(true)
    return () => {
      portalRef.current = null
    }
  }, [])

  useEffect(() => {
    const sections = PHASES.map(({ id }) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    )
    if (!sections.length) return

    const ratios = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target.id, entry.intersectionRatio)
        })
        const [topId] = [...ratios.entries()].sort((a, b) => b[1] - a[1])[0] ?? []
        if (topId && (ratios.get(topId) ?? 0) > 0) setActiveId(topId)
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    )
    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleScrollToPhase = (id: string) => {
    scrollTo(`#${id}`)
  }

  const contentPhases = PHASES.slice(1)
  const activeIndex = contentPhases.findIndex(({ id }) => id === activeId)
  const visible = activeIndex >= 0

  if (!mounted || !portalRef.current) return null

  return createPortal(
    <nav
      className={cn(
        'fixed top-1/2 right-6 z-[100] -translate-y-1/2 transition-opacity duration-500',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
      aria-label='Navigasi fase'
    >
      <div className='mb-2 flex justify-center'>
        <span className='text-foreground/35 font-mono text-[0.6rem] tabular-nums'>
          {activeIndex + 1}
          <span className='text-foreground/20'>/{contentPhases.length}</span>
        </span>
      </div>
      <ol className='flex flex-col items-center gap-1'>
        {contentPhases.map(({ id, label }) => {
          const isActive = activeId === id
          return (
            <li key={id}>
              <button
                onClick={() => handleScrollToPhase(id)}
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
