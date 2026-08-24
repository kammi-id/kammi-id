'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { ViewTransition } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { cn } from '~/lib/shadcn/utils'
import { useSectionReveal } from '~/hooks/use-section-reveal'

interface PengurusHeroClientProps {
  periodLabel: string
  heading: string
  triumvirate: {
    ketua: { name: string; photoSrc: string }
    sekretaris: { name: string; photoSrc: string }
    bendahara: { name: string; photoSrc: string }
  }
}

export const PengurusHeroClient = ({
  periodLabel,
  heading,
  triumvirate
}: PengurusHeroClientProps) => {
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const ketuaRef = useRef<HTMLDivElement>(null)
  const sekjRef = useRef<HTMLDivElement>(null)
  const bendRef = useRef<HTMLDivElement>(null)
  const isDesktopRef = useRef(true)

  const { contextSafe } = useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
        return
      isDesktopRef.current = window.innerWidth >= 768

      if (isDesktopRef.current) {
        gsap.set(textRef.current, { opacity: 0, y: 24, scale: 0.96 })
        gsap.set(ketuaRef.current, { y: '30vh', opacity: 0 })
        gsap.set(sekjRef.current, { x: '-30vw', opacity: 0 })
        gsap.set(bendRef.current, { x: '30vw', opacity: 0 })
      } else {
        gsap.set(textRef.current, { opacity: 0, scale: 1.5, y: '10vh' })
        gsap.set([ketuaRef.current, sekjRef.current, bendRef.current], {
          opacity: 0,
          y: 65
        })
      }
    },
    { scope: sectionRef }
  )

  const reveal = contextSafe(() => {
    if (isDesktopRef.current) {
      gsap
        .timeline()
        .to(textRef.current, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'power3.out'
        })
        .to(
          [sekjRef.current, bendRef.current],
          { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
          '-=0.3'
        )
        .to(
          ketuaRef.current,
          { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
          '-=0.5'
        )
      return
    }

    gsap
      .timeline()
      .to(textRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.85,
        ease: 'power3.out'
      })
      .to(
        [ketuaRef.current, sekjRef.current, bendRef.current],
        { opacity: 1, y: 0, duration: 0.65, ease: 'power3.out', stagger: 0.15 },
        '-=0.35'
      )
  })

  useSectionReveal(sectionRef, reveal)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty(
      '--ph-x',
      `${((e.clientX - rect.left) / rect.width) * 100}%`
    )
    e.currentTarget.style.setProperty(
      '--ph-y',
      `${((e.clientY - rect.top) / rect.height) * 100}%`
    )
  }

  const trio = [
    {
      key: 'sekj' as const,
      label: 'Sekretaris Jenderal',
      member: triumvirate.sekretaris,
      position: 'left' as const,
      ref: sekjRef
    },
    {
      key: 'ketua' as const,
      label: 'Ketua Umum',
      member: triumvirate.ketua,
      position: 'center' as const,
      ref: ketuaRef
    },
    {
      key: 'bend' as const,
      label: 'Bendahara Umum',
      member: triumvirate.bendahara,
      position: 'right' as const,
      ref: bendRef
    }
  ]

  return (
    <section
      ref={sectionRef}
      className='bg-background border-border relative flex min-h-dvh flex-col overflow-hidden border-b'
      aria-labelledby='pengurus-heading'
    >
      {/* Header */}
      <div
        ref={textRef}
        className='px-6 pt-14 pb-4 text-center sm:pt-16 lg:px-8 lg:pt-20'
      >
        <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
          {periodLabel}
        </p>
        <h2
          id='pengurus-heading'
          className='font-heading text-foreground mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-bold'
        >
          {heading}
        </h2>
      </div>

      {/* Photo trio */}
      <div className='mt-auto flex flex-col items-start gap-10 px-6 sm:px-8 md:flex-row md:items-end md:justify-center md:gap-0 lg:px-12'>
        {trio.map(({ key, label, member, position, ref: photoRef }) => {
          const isCenter = position === 'center'
          const isLeft = position === 'left'

          return (
            <div
              key={key}
              ref={photoRef}
              onMouseMove={handleMouseMove}
              className={cn(
                'group bg-muted/60 relative shrink-0 cursor-pointer overflow-visible rounded-[2.5rem] px-4 pt-4 pb-0',
                'md:w-auto md:rounded-none md:bg-transparent md:p-0',
                isLeft
                  ? 'md:-mr-[12vw] lg:-mr-[15vw]'
                  : !isCenter
                    ? 'md:-ml-[12vw] lg:-ml-[15vw]'
                    : '',
                isCenter
                  ? 'z-10 order-1 md:order-none'
                  : isLeft
                    ? 'z-0 order-2 md:order-none'
                    : 'z-0 order-3 md:order-none',
                isCenter
                  ? 'h-[clamp(240px,45vh,380px)] md:h-[min(52vw,950px)]'
                  : 'h-[clamp(210px,40vh,340px)] md:h-[min(48vw,880px)]'
              )}
            >
              {member.photoSrc ? (
                <ViewTransition name={`leadership-photo-${key}`}>
                  <>
                    <Image
                      src={member.photoSrc}
                      alt={`Foto ${member.name}`}
                      width={800}
                      height={1067}
                      sizes='(max-width: 768px) 30vw, 35vw'
                      className='h-full w-auto max-w-none object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.02] max-md:rounded-t-[2rem] max-md:object-left-bottom'
                      unoptimized={member.photoSrc.startsWith('http')}
                    />
                    {/* Radial cursor glow — follows mouse via CSS vars */}
                    <div
                      className='pointer-events-none absolute inset-0 z-[1] opacity-0 transition-opacity duration-200 group-hover:opacity-100 max-md:rounded-t-[2rem]'
                      style={{
                        background:
                          'radial-gradient(circle at var(--ph-x, 50%) var(--ph-y, 50%), oklch(0.52 0.20 17 / 0.13) 0%, transparent 65%)'
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

              {/* Name plate — subtle lift on hover */}
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
                  'max-md:right-[-24px] max-md:bottom-6 max-md:left-auto max-md:flex max-md:max-w-[80%] max-md:translate-x-0 max-md:translate-y-0 max-md:text-right max-md:opacity-100'
                )}
              >
                <p className='text-primary font-sans text-[10px] leading-none font-bold tracking-[0.2em] uppercase'>
                  {label}
                </p>
                <p className='font-heading text-foreground mt-1.5 text-sm leading-tight font-bold md:text-base'>
                  {member.name}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
