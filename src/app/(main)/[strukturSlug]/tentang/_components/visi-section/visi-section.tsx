'use client'

import { useCallback, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useSectionReveal } from '~/hooks/use-section-reveal'

export const VisiSection = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLParagraphElement>(null)
  const textRef = useRef<HTMLHeadingElement>(null)

  const { contextSafe } = useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      gsap.set(titleRef.current, { opacity: 0, y: 20 })
      gsap.set(textRef.current, { opacity: 0, scale: 0.8, y: 20 })
    },
    { scope: sectionRef }
  )

  const revealVisi = useCallback(() => {
    gsap
      .timeline()
      .to(textRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 1,
        ease: 'power2.out'
      })
      .to(
        titleRef.current,
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.7'
      )
  }, [])

  const visiReveal = contextSafe(revealVisi)
  useSectionReveal(sectionRef, visiReveal)

  return (
    <section
      id='visi'
      ref={sectionRef}
      className='bg-primary relative flex min-h-[70vh] flex-col'
      aria-labelledby='visi-heading'
    >
      {/* Sticky title — blended via a primary-tinted scrim instead of a
          hard-edged opaque bar. In normal flow (not overlaid): the
          heading scrolls past underneath it later, and an overlaid
          semi-transparent bar would ghost against it. */}
      <div className='from-primary via-primary to-primary/0 sticky top-20 z-40 bg-linear-to-b pb-6'>
        <p
          ref={titleRef}
          className='text-primary-foreground/70 px-6 pt-4 text-center font-sans text-sm font-semibold tracking-widest uppercase lg:px-8'
        >
          Visi KAMMI
        </p>
      </div>

      <div className='flex flex-1 items-center justify-center px-6 py-16 lg:px-8'>
        <div className='relative mx-auto max-w-5xl text-center'>
          <h2
            ref={textRef}
            id='visi-heading'
            className='font-heading text-primary-foreground text-[clamp(1.75rem,4vw,3.25rem)] leading-snug font-bold'
          >
            Wadah perjuangan permanen yang melahirkan kader-kader Pemimpin
            dalam upaya mewujudkan Bangsa dan Negara Indonesia yang Islami.
          </h2>
        </div>
      </div>
    </section>
  )
}
