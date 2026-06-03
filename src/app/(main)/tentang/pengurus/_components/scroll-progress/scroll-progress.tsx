'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export const ScrollProgress = () => {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const st = ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: ({ progress }) => {
        gsap.set(bar, { scaleY: progress })
      }
    })

    return () => st.kill()
  }, [])

  return (
    <div
      className='pointer-events-none fixed top-0 left-0 z-50 h-dvh w-0.5'
      aria-hidden='true'
    >
      <div
        ref={barRef}
        className='bg-primary h-full w-full origin-top'
        style={{ transform: 'scaleY(0)' }}
      />
    </div>
  )
}
