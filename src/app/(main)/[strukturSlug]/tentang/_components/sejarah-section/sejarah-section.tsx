'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const SejarahSection = () => {
  const containerRef = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const targets = containerRef.current?.querySelectorAll('[data-reveal]')
      if (!targets?.length) return

      gsap.from(targets, {
        y: 40,
        opacity: 0,
        stagger: 0.12,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 75%'
        }
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='sejarah'
      ref={containerRef}
      className='relative min-h-screen bg-[oklch(0.97_0.01_60)] px-6 py-24 lg:px-8 lg:py-36'
      aria-labelledby='sejarah-heading'
    >
      <div className='relative mx-auto max-w-7xl'>
        <span
          className='font-heading text-foreground/[0.04] pointer-events-none absolute -top-6 right-0 text-[clamp(8rem,20vw,18rem)] leading-none font-bold select-none'
          aria-hidden='true'
        >
          08
        </span>

        <div className='max-w-3xl'>
          <p
            data-reveal
            className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'
          >
            Sejarah Singkat
          </p>
          <h2
            id='sejarah-heading'
            data-reveal
            className='font-heading text-foreground mt-3 text-[clamp(2rem,4vw,3.5rem)] leading-tight font-bold'
          >
            Lahir dari Rahim Reformasi
          </h2>
          <div
            data-reveal
            className='bg-primary mt-2 h-1 w-12 rounded-full'
            aria-hidden='true'
          />
          <p
            data-reveal
            className='text-foreground/70 mt-8 font-sans text-base leading-relaxed lg:text-lg'
          >
            KAMMI didirikan pada 29 Maret 1998 di Malang, Jawa Timur, di tengah
            gejolak reformasi yang mengubah wajah Indonesia. Organisasi ini
            lahir dari kesadaran mahasiswa Muslim yang ingin berkontribusi nyata
            dalam perubahan bangsa.
          </p>
          <p
            data-reveal
            className='text-foreground/70 mt-4 font-sans text-base leading-relaxed lg:text-lg'
          >
            Dari kampus ke kampus, KAMMI tumbuh sebagai kekuatan moral yang
            konsisten menjaga arah perubahan tetap berada di jalur keadilan dan
            kebenaran. Hari ini, KAMMI hadir di ratusan kampus di seluruh
            penjuru Indonesia.
          </p>
        </div>

        <div
          data-reveal
          className='bg-foreground/5 mt-16 aspect-video w-full max-w-3xl overflow-hidden rounded-sm'
          aria-label='Video sejarah KAMMI'
        >
          <div className='text-foreground/20 flex h-full w-full flex-col items-center justify-center gap-4'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 24 24'
              fill='currentColor'
              className='text-primary/30 size-14'
              aria-hidden='true'
            >
              <path
                fillRule='evenodd'
                d='M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z'
                clipRule='evenodd'
              />
            </svg>
            <p className='text-foreground/30 font-sans text-xs font-semibold tracking-widest uppercase'>
              Video Sejarah KAMMI
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
