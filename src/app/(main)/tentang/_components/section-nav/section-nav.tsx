'use client'

import { useEffect, useState } from 'react'
import { cn } from '~/lib/shadcn/utils'
import { useLenisScroll } from '~/components/lenis-provider'

const SECTIONS = [
  { id: 'visi', label: 'Visi' },
  { id: 'misi', label: 'Misi' },
  { id: 'karakteristik', label: 'Karakteristik' },
  { id: 'unsur', label: 'Unsur Gerakan' },
  { id: 'prinsip', label: 'Prinsip' },
  { id: 'paradigma', label: 'Paradigma' },
  { id: 'kredo', label: 'Kredo' },
  { id: 'sejarah', label: 'Sejarah' },
]

export const SectionNav = () => {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const { scrollTo } = useLenisScroll()

  useEffect(() => {
    const hero = document.getElementById('tentang-hero')
    if (hero) {
      const heroObserver = new IntersectionObserver(
        ([entry]) => setVisible(!entry.isIntersecting),
        { threshold: 0.1 },
      )
      heroObserver.observe(hero)
      return () => heroObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    const observers = SECTIONS.map(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return null
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { threshold: 0.4 },
      )
      observer.observe(el)
      return observer
    })
    return () => observers.forEach((o) => o?.disconnect())
  }, [])

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) scrollTo(el)
  }

  return (
    <nav
      className={cn(
        'fixed right-6 top-1/2 z-50 -translate-y-1/2 transition-opacity duration-500',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
      aria-label="Section navigation"
    >
      <ol className="flex flex-col items-center gap-3">
        {SECTIONS.map(({ id, label }) => {
          const isActive = activeSection === id
          return (
            <li key={id}>
              <button
                onClick={() => handleScrollTo(id)}
                aria-label={`Go to ${label}`}
                className="group relative flex items-center justify-center"
              >
                <span
                  className={cn(
                    'block rounded-full transition-all duration-300',
                    isActive
                      ? 'size-3 bg-primary'
                      : 'size-1.5 bg-foreground/25 group-hover:bg-foreground/50',
                  )}
                />
                <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded bg-foreground px-2 py-0.5 font-sans text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
                  {label}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
