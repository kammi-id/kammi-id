'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ViewTransition } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { cn } from '~/lib/shadcn/utils'

gsap.registerPlugin(ScrollTrigger)

interface LeadershipSectionClientProps {
  periodLabel: string
  heading: string
  triumvirate: {
    ketua: { name: string; photoSrc: string | null }
    sekretaris: { name: string; photoSrc: string | null }
    bendahara: { name: string; photoSrc: string | null }
  }
  showMoreLink?: boolean
}

export const LeadershipSectionClient = ({
  periodLabel,
  heading,
  triumvirate,
  showMoreLink = false
}: LeadershipSectionClientProps) => {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches
      if (prefersReduced) return

      const q = gsap.utils.selector(section)
      const textWrapper = q('[data-ls-text]')[0] as HTMLElement
      const ketuaEl = q('[data-ls-photo="ketua"]')[0] as HTMLElement
      const sekjEl = q('[data-ls-photo="sekj"]')[0] as HTMLElement
      const bendEl = q('[data-ls-photo="bend"]')[0] as HTMLElement

      if (window.innerWidth >= 768) {
        const textRect = textWrapper.getBoundingClientRect()
        const deltaY =
          window.innerHeight / 2 - (textRect.top + textRect.height / 2)

        gsap.set(textWrapper, {
          scale: 3.5,
          y: deltaY,
          transformOrigin: 'center center'
        })
        gsap.set(ketuaEl, { y: '85vh', scale: 1.15 })
        gsap.set(sekjEl, { x: '-55vw' })
        gsap.set(bendEl, { x: '55vw' })

        const tl = gsap.timeline()

        tl.to(textWrapper, { scale: 1, y: 0, ease: 'none', duration: 0.38 }, 0)
        tl.fromTo(
          ketuaEl,
          { y: '85vh', scale: 1.15 },
          { y: 0, scale: 1, ease: 'none', duration: 0.42 },
          0.18
        )
        tl.fromTo(
          sekjEl,
          { x: '-55vw' },
          { x: 0, ease: 'none', duration: 0.45 },
          0.27
        )
        tl.fromTo(
          bendEl,
          { x: '55vw' },
          { x: 0, ease: 'none', duration: 0.45 },
          0.32
        )

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          animation: tl,
          clamp: true
        } as any)
      } else {
        gsap.set(textWrapper, { opacity: 0, scale: 1.5, y: '10vh' })
        gsap.set([ketuaEl, sekjEl, bendEl], { opacity: 0, y: 65 })

        gsap
          .timeline({ delay: 0.2 })
          .to(textWrapper, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out'
          })
          .to(
            [ketuaEl, sekjEl, bendEl],
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              ease: 'power3.out',
              stagger: 0.15
            },
            '-=0.35'
          )
      }
    }, section)

    return () => ctx.revert()
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty(
      '--ls-x',
      `${((e.clientX - rect.left) / rect.width) * 100}%`
    )
    e.currentTarget.style.setProperty(
      '--ls-y',
      `${((e.clientY - rect.top) / rect.height) * 100}%`
    )
  }

  const trio = [
    {
      key: 'sekj' as const,
      label: 'Sekretaris Jenderal',
      name: triumvirate.sekretaris.name,
      photoSrc: triumvirate.sekretaris.photoSrc,
      position: 'left' as const
    },
    {
      key: 'ketua' as const,
      label: 'Ketua Umum',
      name: triumvirate.ketua.name,
      photoSrc: triumvirate.ketua.photoSrc,
      position: 'center' as const
    },
    {
      key: 'bend' as const,
      label: 'Bendahara Umum',
      name: triumvirate.bendahara.name,
      photoSrc: triumvirate.bendahara.photoSrc,
      position: 'right' as const
    }
  ]

  return (
    <section
      ref={sectionRef}
      className='bg-background border-border relative flex h-dvh flex-col overflow-hidden border-b'
      aria-labelledby='leadership-heading'
    >
      {/* Header — starts huge at center on desktop, collapses to top as scroll progresses */}
      <div
        data-ls-text
        className='px-6 pt-14 pb-4 text-center sm:pt-16 lg:px-8 lg:pt-20'
      >
        <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
          {periodLabel}
        </p>
        <h2
          id='leadership-heading'
          className='font-heading text-foreground mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-bold'
        >
          {heading}
        </h2>

        {showMoreLink && (
          <div className='mt-6 mb-12 flex justify-center'>
            <Link
              href='/tentang/pengurus'
              className='text-primary hover:text-primary/80 group flex items-center gap-2 font-sans text-sm font-semibold transition-colors'
            >
              Lihat Seluruh Pengurus Pusat
              <svg
                className='size-4 transition-transform group-hover:translate-x-1'
                viewBox='0 0 16 16'
                fill='none'
                aria-hidden='true'
              >
                <path
                  d='M6 12l4-4-4-4'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Photo trio — converge from edges as scroll progresses */}
      <div className='mt-auto flex flex-col items-start gap-10 px-6 sm:px-8 md:flex-row md:items-end md:justify-center md:gap-0 lg:px-12'>
        {trio.map(({ key, label, name, photoSrc, position }) => {
          const isCenter = position === 'center'
          const isLeft = position === 'left'

          return (
            <div
              key={key}
              data-ls-photo={key}
              onMouseMove={handleMouseMove}
              className={cn(
                'group relative shrink-0 cursor-pointer overflow-visible rounded-[2.5rem] bg-muted/60 px-4 pt-4 pb-0',
                'md:w-auto md:rounded-none md:bg-transparent md:p-0',
                isLeft
                  ? 'md:-mr-[12vw] lg:-mr-[15vw]'
                  : !isCenter
                    ? 'md:-ml-[12vw] lg:-ml-[15vw]'
                    : '',
                isCenter
                  ? 'order-1 z-10 md:order-none'
                  : isLeft
                    ? 'order-2 z-0 md:order-none'
                    : 'order-3 z-0 md:order-none',
                isCenter
                  ? 'h-[clamp(240px,45vh,380px)] md:h-[min(52vw,950px)]'
                  : 'h-[clamp(210px,40vh,340px)] md:h-[min(48vw,880px)]'
              )}
            >
              {photoSrc ? (
                <ViewTransition name={`leadership-photo-${key}`}>
                  <>
                    <Image
                      src={photoSrc}
                      alt={`Foto ${name}`}
                      width={800}
                      height={1067}
                      className='h-full w-auto max-w-none object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.02] max-md:rounded-t-[2rem] max-md:object-left-bottom'
                      unoptimized={photoSrc.startsWith('http')}
                    />
                    {/* Radial cursor glow */}
                    <div
                      className='pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-200 group-hover:opacity-100 max-md:rounded-t-[2rem]'
                      style={{
                        background:
                          'radial-gradient(circle at var(--ls-x, 50%) var(--ls-y, 50%), oklch(0.52 0.20 17 / 0.13) 0%, transparent 65%)'
                      }}
                    />
                  </>
                </ViewTransition>
              ) : (
                <div
                  className='bg-muted/30 h-full rounded-t-[2rem]'
                  style={{ aspectRatio: '3/4' }}
                />
              )}

              {/* Frosted name plate */}
              <div
                className={cn(
                  'absolute rounded-xl px-4 py-2.5',
                  'bg-white/85 shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-white/50 backdrop-blur-md',
                  'w-max max-w-[85%] transition-[opacity,transform] duration-200 ease-out',
                  'bottom-12 translate-y-1 opacity-70 max-md:hidden',
                  'group-hover:translate-y-0 group-hover:opacity-100',
                  isCenter
                    ? 'left-1/2 -translate-x-1/2 text-center'
                    : isLeft
                      ? 'left-8 text-left'
                      : 'right-8 text-right',
                  'max-md:right-[-24px] max-md:bottom-6 max-md:left-auto max-md:flex max-md:max-w-[80%] max-md:translate-y-0 max-md:translate-x-0 max-md:opacity-100 max-md:text-right'
                )}
              >
                <p className='text-primary font-sans text-[10px] leading-none font-bold tracking-[0.2em] uppercase'>
                  {label}
                </p>
                <p className='font-heading text-foreground mt-1.5 text-sm leading-tight font-bold md:text-base'>
                  {name}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
