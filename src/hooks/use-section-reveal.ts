'use client'

import { useEffect } from 'react'
import type { RefObject } from 'react'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

// Plays `reveal` once when `sectionRef` enters the viewport. No-op under
// prefers-reduced-motion — content already renders in its resting state.
export const useSectionReveal = (
  sectionRef: RefObject<HTMLElement | null>,
  reveal: () => void
) => {
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        reveal()
        observer.disconnect()
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionRef])
}
