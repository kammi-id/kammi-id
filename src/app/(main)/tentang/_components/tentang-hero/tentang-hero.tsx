'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const TentangHero = () => {
  const containerRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const scrollCueRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })
      tl.from(headingRef.current, { y: 80, opacity: 0, duration: 1.2 }).from(
        scrollCueRef.current,
        { opacity: 0, duration: 0.6 },
        '-=0.3'
      )

      gsap.to(scrollCueRef.current, {
        y: 8,
        repeat: -1,
        yoyo: true,
        duration: 0.9,
        ease: 'sine.inOut',
        delay: 1.8
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='tentang-hero'
      ref={containerRef}
      className='relative flex h-full flex-col justify-center overflow-hidden bg-transparent px-6 lg:px-8'
      aria-labelledby='tentang-heading'
    >
      <div className='mx-auto w-full max-w-7xl text-center'>
        <h1
          ref={headingRef}
          id='tentang-heading'
          className='font-heading text-foreground text-[clamp(4rem,10vw,9rem)] leading-[0.9] font-bold tracking-tight'
        >
          Tentang
          <br />
          <span className='text-primary'>KAMMI</span>
        </h1>
      </div>

      <div
        ref={scrollCueRef}
        className='absolute bottom-10 left-1/2 -translate-x-1/2'
        aria-hidden='true'
      >
        <svg
          className='text-muted-foreground size-6'
          viewBox='0 0 24 24'
          fill='none'
        >
          <path
            d='M12 5v14M5 12l7 7 7-7'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </div>

      <div
        className='pointer-events-none absolute inset-0 -z-10 overflow-hidden'
        aria-hidden='true'
      >
        <div className='bg-primary/5 absolute top-1/4 right-0 h-[600px] w-[600px] translate-x-1/2 -translate-y-1/4 rounded-full blur-3xl' />
      </div>
    </section>
  )
}
