'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

type MemberData = {
  id: string
  name: string
  role: string
  photoSrc: string
}

export type BlockData = {
  id: string
  title: string
  members: MemberData[]
}

interface LeadersDirectoryClientProps {
  blocks: BlockData[]
}

const Monogram = ({ name }: { name: string }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
  return (
    <div className='bg-muted text-muted-foreground flex h-full w-full items-center justify-center text-lg font-semibold'>
      {initials || '?'}
    </div>
  )
}

export const LeadersDirectoryClient = ({
  blocks
}: LeadersDirectoryClientProps) => {
  const sectionRef = useRef<HTMLElement>(null)

  // Each block reveals as a whole once it enters the viewport: title/line
  // sweep in first, cards stagger up right behind them — no scroll-scrub.
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return

    const blockEls = Array.from(
      section.querySelectorAll<HTMLElement>('[data-block]')
    )
    if (!blockEls.length) return

    const ctx = gsap.context(() => {
      blockEls.forEach((blockEl) => {
        const titleEl = blockEl.querySelector<HTMLElement>('[data-title]')
        const lineEl = blockEl.querySelector<HTMLElement>('[data-line]')
        const cards = Array.from(
          blockEl.querySelectorAll<HTMLElement>('[data-card]')
        )

        gsap.set(cards, { y: 52, opacity: 0 })
        if (titleEl) gsap.set(titleEl, { x: -36, opacity: 0 })
        if (lineEl)
          gsap.set(lineEl, { scaleX: 0, transformOrigin: 'left center' })
      })
    }, section)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const blockEl = entry.target as HTMLElement
          const titleEl = blockEl.querySelector<HTMLElement>('[data-title]')
          const lineEl = blockEl.querySelector<HTMLElement>('[data-line]')
          const cards = Array.from(
            blockEl.querySelectorAll<HTMLElement>('[data-card]')
          )

          ctx.add(() => {
            const tl = gsap.timeline()
            if (titleEl)
              tl.to(titleEl, {
                x: 0,
                opacity: 1,
                duration: 0.5,
                ease: 'power3.out'
              })
            if (lineEl)
              tl.to(
                lineEl,
                { scaleX: 1, duration: 0.4, ease: 'power2.out' },
                '-=0.2'
              )
            tl.to(
              cards,
              {
                y: 0,
                opacity: 1,
                duration: 0.6,
                stagger: 0.06,
                ease: 'power3.out'
              },
              '-=0.2'
            )
          })

          observer.unobserve(blockEl)
        })
      },
      { threshold: 0.15 }
    )
    blockEls.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
      ctx.revert()
    }
  }, [blocks])

  return (
    <section
      ref={sectionRef}
      id='jajaran-pengurus'
      aria-label='Jajaran Pengurus'
      className='bg-background border-border border-t px-6 pt-20 pb-16 lg:px-8 lg:pt-28 lg:pb-20'
    >
      <div className='mx-auto max-w-6xl space-y-14'>
        {blocks.map((block) => {
          if (!block.members.length) return null

          return (
            <div key={block.id} data-block className='space-y-8'>
              {block.title && (
                <div className='flex flex-col items-center gap-3'>
                  <h3
                    data-title
                    className='font-heading text-foreground text-center text-xl font-bold tracking-tight'
                  >
                    {block.title}
                  </h3>
                  <div
                    data-line
                    className='bg-primary/40 h-px w-10 rounded-full'
                  />
                </div>
              )}

              <div className='flex flex-wrap justify-center gap-x-4 gap-y-8'>
                {block.members.map((member) => (
                  <div
                    key={member.id}
                    data-card
                    className='w-[calc(50%-8px)] min-w-0 sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]'
                  >
                    <div className='group flex flex-col'>
                      <div className='bg-muted relative aspect-[3/4] w-full overflow-hidden rounded-xl pt-2'>
                        {member.photoSrc ? (
                          <div className='absolute inset-0 top-2'>
                            <Image
                              src={member.photoSrc}
                              alt={`Foto ${member.name}`}
                              fill
                              sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                              className='object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]'
                              unoptimized={member.photoSrc.startsWith('http')}
                            />
                          </div>
                        ) : (
                          <Monogram name={member.name} />
                        )}
                      </div>
                      <div className='mt-3 space-y-0.5 px-0.5'>
                        <p
                          className='text-primary line-clamp-1 font-sans text-[9px] font-semibold tracking-[0.18em] uppercase sm:text-[10px] lg:text-xs'
                          title={member.role}
                        >
                          {member.role}
                        </p>
                        <p
                          className='text-foreground line-clamp-2 text-sm leading-snug font-semibold lg:text-base'
                          title={member.name}
                        >
                          {member.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
