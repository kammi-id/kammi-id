'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const PARADIGMA_ITEMS = [
  { num: '01', title: 'KAMMI adalah gerakan dakwah tauhid' },
  { num: '02', title: 'KAMMI adalah intelektual profetik' },
  { num: '03', title: 'KAMMI adalah gerakan sosial independen' },
  { num: '04', title: 'KAMMI adalah gerakan politik ekstraparlementer' }
]

export const ParadigmaSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const items = containerRef.current?.querySelectorAll(
        '[data-paradigma-item]'
      )
      if (!items?.length) return

      gsap.from(items, {
        x: 50,
        opacity: 0,
        stagger: 0.14,
        duration: 0.8,
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
      id='paradigma'
      ref={containerRef}
      className='bg-background relative min-h-screen px-6 py-24 lg:px-8 lg:py-36'
      aria-labelledby='paradigma-heading'
    >
      <div className='relative mx-auto max-w-7xl'>
        <span
          className='font-heading text-foreground/[0.04] pointer-events-none absolute -top-6 right-0 text-[clamp(8rem,20vw,18rem)] leading-none font-bold select-none'
          aria-hidden='true'
        >
          07
        </span>

        <div className='mb-16'>
          <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
            Paradigma Gerakan KAMMI
          </p>
          <h2
            id='paradigma-heading'
            className='font-heading text-foreground mt-3 text-[clamp(2rem,4vw,3.5rem)] leading-tight font-bold'
          >
            Empat Bingkai Pandang
          </h2>
        </div>

        <div className='divide-border divide-y'>
          {PARADIGMA_ITEMS.map((item) => (
            <div
              key={item.num}
              data-paradigma-item
              className='flex items-start gap-8 py-8'
            >
              <span
                className='font-heading text-primary/30 w-14 shrink-0 text-4xl font-bold tabular-nums'
                aria-hidden='true'
              >
                {item.num}
              </span>
              <h3 className='font-heading text-foreground text-xl leading-snug font-bold lg:text-2xl'>
                {item.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
