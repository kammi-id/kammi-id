'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const KARAKTERISTIK_ITEMS = [
  { title: 'Harokatu Tajnid', subtitle: 'Organisasi Pengkaderan' },
  { title: 'Harokatu Amal', subtitle: 'Organisasi Pergerakan' }
]

export const KarakteristikSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const cols = containerRef.current?.querySelectorAll('[data-kar-col]')
      if (!cols?.length) return

      gsap.from(cols, {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%'
        }
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='karakteristik'
      ref={containerRef}
      className='bg-background relative min-h-screen px-6 py-24 lg:px-8 lg:py-36'
      aria-labelledby='karakteristik-heading'
    >
      <div className='relative mx-auto max-w-7xl'>
        <span
          className='font-heading text-foreground/[0.04] pointer-events-none absolute -top-6 right-0 text-[clamp(8rem,20vw,18rem)] leading-none font-bold select-none'
          aria-hidden='true'
        >
          04
        </span>

        <div className='mb-16'>
          <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
            Karakteristik KAMMI
          </p>
          <h2
            id='karakteristik-heading'
            className='font-heading text-foreground mt-3 text-[clamp(2rem,4vw,3.5rem)] leading-tight font-bold'
          >
            Dua Watak Dasar
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-x-20 gap-y-12 lg:grid-cols-2'>
          {KARAKTERISTIK_ITEMS.map((item, i) => (
            <div
              key={i}
              data-kar-col
              className='border-primary border-t-2 pt-8'
            >
              <h3 className='font-heading text-foreground text-[clamp(1.75rem,3vw,2.5rem)] leading-snug font-bold'>
                {item.title}
              </h3>
              <p className='text-muted-foreground mt-2 font-sans text-sm font-semibold tracking-widest uppercase'>
                {item.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
