'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const UNSUR_ITEMS = [
  { num: '01', title: 'Membangun Basis Sosial' },
  { num: '02', title: 'Membangun Basis Operasional' },
  { num: '03', title: 'Membangun Basis Konsep' },
  { num: '04', title: 'Membangun Basis Kebijakan' }
]

export const UnsurSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const items = containerRef.current?.querySelectorAll('[data-unsur-item]')
      if (!items?.length) return

      gsap.from(items, {
        scale: 0.88,
        opacity: 0,
        stagger: 0.12,
        duration: 0.75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 65%'
        }
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='unsur'
      ref={containerRef}
      className='relative min-h-screen bg-[oklch(0.97_0.01_60)] px-6 py-24 lg:px-8 lg:py-36'
      aria-labelledby='unsur-heading'
    >
      <div className='relative mx-auto max-w-7xl'>
        <span
          className='font-heading text-foreground/[0.04] pointer-events-none absolute -top-6 right-0 text-[clamp(8rem,20vw,18rem)] leading-none font-bold select-none'
          aria-hidden='true'
        >
          05
        </span>

        <div className='mb-16'>
          <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
            Unsur Gerakan KAMMI
          </p>
          <h2
            id='unsur-heading'
            className='font-heading text-foreground mt-3 text-[clamp(2rem,4vw,3.5rem)] leading-tight font-bold'
          >
            Empat Pilar Gerak
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4'>
          {UNSUR_ITEMS.map((item) => (
            <div key={item.num} data-unsur-item className='flex flex-col'>
              <span
                className='font-heading text-primary/20 text-5xl font-bold lg:text-6xl'
                aria-hidden='true'
              >
                {item.num}
              </span>
              <h3 className='font-heading text-foreground mt-4 text-xl font-bold'>
                {item.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
