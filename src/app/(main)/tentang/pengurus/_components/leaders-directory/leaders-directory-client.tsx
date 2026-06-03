'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

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
  const blockRefsMap = useRef(new Map<string, HTMLDivElement>())
  const cardRefsMap = useRef(new Map<string, HTMLDivElement[]>())
  const titleRefsMap = useRef(new Map<string, HTMLElement>())
  const lineRefsMap = useRef(new Map<string, HTMLDivElement>())

  useEffect(() => {
    if (!sectionRef.current) return
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (prefersReduced) return

    const cleanups: (() => void)[] = []

    // Each animation phase occupies an exclusive scroll window — no overlap.
    // Next card starts exactly when previous card is fully in place.
    const TITLE_PX = 80 // scroll range for title sweep
    const LINE_PX = 60 // scroll range for line expand (after title)
    const CARD_PX = 140 // scroll range per card (deliberate, sequential)
    const V = '85%' // viewport reference line

    blocks.forEach((block) => {
      const blockEl = blockRefsMap.current.get(block.id)
      const cards = cardRefsMap.current.get(block.id) ?? []
      const titleEl = titleRefsMap.current.get(block.id)
      const lineEl = lineRefsMap.current.get(block.id)

      if (!blockEl || cards.length === 0) return

      // Set initial hidden states
      gsap.set(cards, { y: 52, opacity: 0 })
      if (titleEl) gsap.set(titleEl, { x: -36, opacity: 0 })
      if (lineEl)
        gsap.set(lineEl, { scaleX: 0, transformOrigin: 'left center' })

      // Title sweeps in first
      if (titleEl) {
        const t = ScrollTrigger.create({
          trigger: blockEl,
          start: `top ${V}`,
          end: `top+=${TITLE_PX} ${V}`,
          scrub: true,
          animation: gsap.fromTo(
            titleEl,
            { x: -36, opacity: 0 },
            { x: 0, opacity: 1, ease: 'none' }
          )
        })
        cleanups.push(() => t.kill())
      }

      // Line expands after title is done
      if (lineEl) {
        const lineStart = block.title ? TITLE_PX : 0
        const t = ScrollTrigger.create({
          trigger: blockEl,
          start: `top+=${lineStart} ${V}`,
          end: `top+=${lineStart + LINE_PX} ${V}`,
          scrub: true,
          animation: gsap.fromTo(
            lineEl,
            { scaleX: 0 },
            { scaleX: 1, ease: 'none' }
          )
        })
        cleanups.push(() => t.kill())
      }

      // Cards start after title+line header area.
      // Each card occupies an exclusive CARD_PX window — strictly sequential.
      // Row N+1 naturally starts only after all cards in row N are done.
      const headerOffset = block.title ? TITLE_PX + LINE_PX : 0

      // Cards — strict sequential, each waits for previous to be in place.
      // Card i starts exactly at the scroll position where card i-1 ends.
      // Rows are implicitly sequential: row N+1 starts only after all
      // cards in row N have completed (since indices are left-to-right,
      // top-to-bottom in DOM order).
      cards.forEach((card, i) => {
        const cardStart = headerOffset + i * CARD_PX
        const t = ScrollTrigger.create({
          trigger: blockEl,
          start: `top+=${cardStart} ${V}`,
          end: `top+=${cardStart + CARD_PX} ${V}`,
          scrub: true,
          animation: gsap.fromTo(
            card,
            { y: 52, opacity: 0 },
            { y: 0, opacity: 1, ease: 'none' }
          )
        })
        cleanups.push(() => t.kill())
      })
    })

    return () => cleanups.forEach((fn) => fn())
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
            <div
              key={block.id}
              ref={(el) => {
                if (el) blockRefsMap.current.set(block.id, el)
                else blockRefsMap.current.delete(block.id)
              }}
              className='space-y-8'
            >
              {block.title && (
                <div className='flex flex-col items-center gap-3'>
                  <h3
                    ref={(el) => {
                      if (el) titleRefsMap.current.set(block.id, el)
                      else titleRefsMap.current.delete(block.id)
                    }}
                    className='font-heading text-foreground text-center text-xl font-bold tracking-tight'
                  >
                    {block.title}
                  </h3>
                  <div
                    ref={(el) => {
                      if (el) lineRefsMap.current.set(block.id, el)
                      else lineRefsMap.current.delete(block.id)
                    }}
                    className='bg-primary/40 h-px w-10 rounded-full'
                  />
                </div>
              )}

              <div className='flex flex-wrap justify-center gap-x-4 gap-y-8'>
                {block.members.map((member, memberIndex) => (
                  <div
                    key={member.id}
                    ref={(el) => {
                      if (!cardRefsMap.current.has(block.id)) {
                        cardRefsMap.current.set(block.id, [])
                      }
                      const arr = cardRefsMap.current.get(block.id)!
                      if (el) arr[memberIndex] = el
                      else delete arr[memberIndex]
                    }}
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
