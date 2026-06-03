'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

export const TentangHero = () => {
  const containerRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const scrollCueRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap
        .timeline({ defaults: { ease: 'power4.out' } })
        .from(headingRef.current, { y: 60, opacity: 0, duration: 1.2 })
        .from(subRef.current, { y: 12, opacity: 0, duration: 0.7 }, '-=0.5')
        .from(scrollCueRef.current, { opacity: 0, duration: 0.6 }, '-=0.3')

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
      <div className='mx-auto w-full max-w-7xl'>
        <h1
          ref={headingRef}
          id='tentang-heading'
          className='font-heading text-white'
        >
          <span className='mb-5 block font-sans text-xs font-semibold tracking-[0.35em] text-white/50 uppercase'>
            Tentang
          </span>
          <span className='block text-[clamp(2.75rem,8vw,7.5rem)] leading-[0.92] font-bold tracking-tight'>
            Kesatuan Aksi
            <br />
            <span className='text-primary'>Mahasiswa Muslim</span>
            <br />
            Indonesia
          </span>
        </h1>
        {/* Navigation hint — tells first-timers what's inside */}
        <p
          ref={subRef}
          className='mt-8 font-sans text-sm tracking-[0.2em] text-white/45 uppercase'
        >
          Visi&ensp;·&ensp;Misi&ensp;·&ensp;Prinsip&ensp;·&ensp;Paradigma&ensp;·&ensp;Kredo
        </p>
      </div>

      {/* Scroll cue — raised above iOS browser chrome via safe-area-inset-bottom */}
      <div
        ref={scrollCueRef}
        className='absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5'
        style={{
          bottom: 'max(2.5rem, calc(env(safe-area-inset-bottom) + 1rem))'
        }}
        aria-hidden='true'
      >
        <span className='font-sans text-[0.6rem] tracking-[0.25em] text-white/55 uppercase'>
          Gulir
        </span>
        <svg className='size-5 text-white/65' viewBox='0 0 24 24' fill='none'>
          <path
            d='M12 5v14M5 12l7 7 7-7'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </div>
    </section>
  )
}
