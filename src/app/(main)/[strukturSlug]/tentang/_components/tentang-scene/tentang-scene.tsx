'use client'

/**
 * TentangScene — six normal-flow sections (Hero, Visi, Misi, Prinsip,
 * Paradigma, Kredo). Each section (or, for the two long lists, each item)
 * plays its own one-shot GSAP entrance the first time it enters the
 * viewport, via a plain IntersectionObserver. No pin, no scroll-scrub, no
 * cross-section transition — sections sit where the document puts them.
 */

import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { TentangHero } from '../tentang-hero'
import { VisiSection } from '../visi-section'
import { useSectionReveal } from '~/hooks/use-section-reveal'
import type { TentangSettings } from '~/db/query/site-settings'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const MISI_ITEMS = [
  'Membina keislaman, keimanan, dan ketaqwaan mahasiswa muslim Indonesia.',
  'Menggali, mengembangkan, dan memantapkan potensi dakwah, intelektual, sosial, dan politik mahasiswa.',
  'Mencerahkan dan meningkatkan kualitas masyarakat Indonesia menjadi masyarakat yang rabbani, madani (civil society).',
  'Memelopori dan memelihara komunikasi, solidaritas, dan kerjasama mahasiswa Indonesia dalam menyelesaikan permasalahan kerakyatan dan kebangsaan.',
  'Mengembangkan kerjasama antar elemen masyarakat dengan semangat membawa kebaikan, menyebar manfaat, dan mencegah kemungkaran (amar maruf nahi munkar).'
]

// Each principle reads "{x} adalah {y} KAMMI"; x and y are the prominent phrases.
const PRINSIP_ITEMS = [
  { num: '01', x: 'Kemenangan Islam', y: 'jiwa perjuangan' },
  { num: '02', x: 'Kebatilan', y: 'musuh abadi' },
  { num: '03', x: 'Solusi Islam', y: 'tawaran perjuangan' },
  { num: '04', x: 'Perbaikan', y: 'tradisi perjuangan' },
  { num: '05', x: 'Kepemimpinan ummat', y: 'strategi perjuangan' },
  { num: '06', x: 'Persaudaraan', y: 'watak muamalah' }
]

// Each paradigm reads "KAMMI adalah gerakan {n}"; n is the highlighted phrase.
const PARADIGMA_ITEMS = [
  { num: '01', n: 'dakwah tauhid' },
  { num: '02', n: 'intelektual profetik' },
  { num: '03', n: 'sosial independen' },
  { num: '04', n: 'politik ekstraparlementer' }
]

// Full kredo text, written out as one continuous "constitution" — numerals dropped.
const KREDO_ITEMS = [
  'Kami adalah orang-orang yang berpikir dan berkehendak merdeka. Tidak ada satu orang pun yang bisa memaksa kami bertindak. Kami hanya bertindak atas dasar pemahaman, bukan taklid, serta atas dasar keikhlasan, bukan mencari pujian atau kedudukan.',
  'Kami adalah orang-orang pemberani. Hanyalah Allah yang kami takuti. Tidak ada satu makhluk pun yang bisa menggentarkan hati kami, atau membuat kami tertunduk apalagi takluk kepadanya. Tiada yang kami takuti, kecuali ketakutan kepada-Nya.',
  'Kami adalah para petarung sejati. Atas nama al-haq kami bertempur, sampai tidak ada lagi fitnah di muka bumi ini. Kami bukan golongan orang yang melarikan diri dari medan pertempuran atau orang-orang yang enggan pergi berjihad. Kami akan memenangkan setiap pertarungan dengan menegakkan prinsip-prinsip Islam.',
  'Kami adalah penghitung risiko yang cermat, tetapi kami bukanlah orang-orang yang takut mengambil risiko. Syahid adalah kemuliaan dan cita-cita tertinggi kami. Kami adalah para perindu surga. Kami akan menyebarkan aromanya di dalam kehidupan keseharian kami kepada suasana lingkungan kami. Hari-hari kami senantiasa dihiasi dengan tilawah, zikir, saling menasihati dalam kebenaran dan kesabaran, diskusi-diskusi yang bermanfaat dan jauh dari kesia-siaan, serta kerja-kerja yang konkret bagi perbaikan masyarakat. Kami adalah putra-putri kandung dakwah, akan beredar bersama dakwah ini ke mana pun perginya, menjadi pembangunnya yang paling tekun, menjadi penyebarnya yang paling agresif, serta penegaknya yang paling kukuh.',
  'Kami adalah orang-orang yang senantiasa menyiapkan diri untuk masa depan Islam. Kami bukanlah orang yang suka berleha-leha, minimalis dan loyo. Kami senantiasa bertebaran di dalam kehidupan, melakukan eksperimen yang terencana, dan kami adalah orang-orang progressif yang bebas dari kejumudan, karena kami memandang bahwa kehidupan ini adalah tempat untuk belajar, agar kami dan para penerus kami menjadi perebut kemenangan yang hanya akan kami persembahkan untuk Islam.',
  'Kami adalah ilmuwan yang tajam analisisnya, pemuda yang kritis terhadap kebatilan, politisi yang piawai mengalahkan muslihat musuh dan yang piawai dalam memperjuangkan kepentingan umat, seorang pejuang di siang hari dan rahib di malam hari, pemimpin yang bermoral, teguh pada prinsip dan mampu mentransformasikan masyarakat, guru yang mampu memberikan kepahaman dan teladan, sahabat yang tulus dan penuh kasih sayang, relawan yang mampu memecahkan masalah sosial, warga yang ramah kepada masyarakatnya dan responsif terhadap masalah mereka, manajer yang efektif dan efisien, prajurit yang gagah berani dan pintar bersiasat, diplomat yang terampil berdialog, piawai berwacana, luas pergaulannya, percaya diri yang tinggi, semangat yang berkobar tinggi.'
]

// Hand-drawn highlighter swipe behind a phrase (felt-tip marker feel). The rough
// blob rides as a background image with box-decoration-break: clone, so a phrase
// that wraps onto several lines gets a full swipe on every line, not just one.
// opacity lets the swipe ride brighter on dark backgrounds.
const HL_SWIPE =
  "%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 100' preserveAspectRatio='none'%3E%3Cpath d='M4,56 C76,47 168,52 297,46 C299,63 298,81 292,92 C198,95 90,93 9,96 C2,84 3,68 4,56 Z' fill='%23c1133d'"

const Marker = ({
  children,
  opacity = 0.25
}: {
  children: ReactNode
  opacity?: number
}) => (
  <span
    style={{
      backgroundImage: `url("data:image/svg+xml,${HL_SWIPE} fill-opacity='${opacity}'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '100% 0.95em',
      backgroundPosition: '0 88%',
      boxDecorationBreak: 'clone',
      WebkitBoxDecorationBreak: 'clone',
      padding: '0 0.06em'
    }}
  >
    {children}
  </span>
)

// Hand-drawn underline (two slightly offset rough strokes). non-scaling-stroke
// keeps the line weight even though the SVG is stretched horizontally.
const Underline = ({ children }: { children: ReactNode }) => (
  <span className='text-primary relative inline-block font-bold'>
    <span className='relative'>{children}</span>
    <svg
      className='pointer-events-none absolute left-0 w-full'
      style={{ bottom: '-0.14em', height: '0.36em' }}
      viewBox='0 0 300 24'
      preserveAspectRatio='none'
      aria-hidden='true'
    >
      <path
        className='stroke-primary'
        d='M4,15 C 62,7 122,19 192,11 C 244,5 276,15 297,9'
        strokeWidth={4}
        strokeLinecap='round'
        fill='none'
        vectorEffect='non-scaling-stroke'
      />
      <path
        className='stroke-primary/55'
        d='M9,20 C 72,14 140,22 210,16 C 252,12 280,18 295,15'
        strokeWidth={2.5}
        strokeLinecap='round'
        fill='none'
        vectorEffect='non-scaling-stroke'
      />
    </svg>
  </span>
)

// Counter-clockwise rotations per card (negative = CCW) — the misi cards'
// "pile on the table" tilt, now a resting state instead of a stack order.
const CARD_ROTATIONS = [-3, 1.5, -1, 2.5, -2] as const

// sRGB values (not oklch) for the two colors this page uses that have no
// DESIGN.md token — each maps to an oklch design intent noted alongside it:
const DARK = 'rgb(31, 24, 26)' //       oklch(0.18 0.012 17) — warm near-black
const PARCHMENT = 'rgb(244, 240, 231)' // oklch(0.96 0.012 85) — manuscript paper

// Fires `reveal(index)` once for each element matching `selector` inside
// `containerRef`, independently, as that element enters the viewport. Used
// for the two sections long enough that a single section-wide trigger would
// fire before later items are anywhere near the screen.
const useItemReveal = (
  containerRef: RefObject<HTMLElement | null>,
  selector: string,
  reveal: (el: HTMLElement, index: number) => void
) => {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return

    const items = Array.from(container.querySelectorAll<HTMLElement>(selector))
    if (!items.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          reveal(
            entry.target as HTMLElement,
            items.indexOf(entry.target as HTMLElement)
          )
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.3 }
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef])
}

// Like useItemReveal, but elements that cross the viewport threshold in the
// same tick are handed to `reveal` together as one batch — so a grid where a
// whole row enters at once (wide viewports) can stagger that row, while a
// single-column layout (mobile, one card in view at a time) naturally gets
// batches of one and behaves exactly like an individual per-item reveal.
const useBatchedItemReveal = (
  containerRef: RefObject<HTMLElement | null>,
  selector: string,
  reveal: (elements: HTMLElement[]) => void
) => {
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return

    const items = Array.from(container.querySelectorAll<HTMLElement>(selector))
    if (!items.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const batch = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement)
        if (!batch.length) return
        batch.forEach((el) => observer.unobserve(el))
        reveal(batch)
      },
      { threshold: 0.3 }
    )
    items.forEach((item) => observer.observe(item))
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef])
}

export const TentangScene = ({ settings }: { settings: TentangSettings }) => {
  const rootRef = useRef<HTMLDivElement>(null)

  const misiSectionRef = useRef<HTMLDivElement>(null)
  const prinsipSectionRef = useRef<HTMLDivElement>(null)
  const paradigmaSectionRef = useRef<HTMLDivElement>(null)
  const kredoSectionRef = useRef<HTMLDivElement>(null)

  const misiLabelRef = useRef<HTMLParagraphElement>(null)
  const prinsipEyebrowRef = useRef<HTMLParagraphElement>(null)
  const paradigmaEyebrowRef = useRef<HTMLParagraphElement>(null)
  const kredoEyebrowRef = useRef<HTMLParagraphElement>(null)
  const kredoDocRef = useRef<HTMLDivElement>(null)

  const { contextSafe } = useGSAP(
    () => {
      if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return

      gsap.set(misiLabelRef.current, { opacity: 0 })
      gsap.set('.misi-card', { opacity: 0, y: 40 })
      gsap.set(prinsipEyebrowRef.current, { opacity: 0, y: 20 })
      gsap.set('.prinsip-item-frame', {
        clipPath: 'inset(0% 50% 0% 50%)',
        scale: 1.12
      })
      gsap.set('.prinsip-item-text', { opacity: 0, scale: 0.92 })
      gsap.set(paradigmaEyebrowRef.current, { opacity: 0, y: 20 })
      gsap.set('.paradigma-copy', { autoAlpha: 0, x: -48 })
      gsap.set('.paradigma-photo', {
        autoAlpha: 0,
        x: 72,
        rotation: 8,
        transformOrigin: '50% 50%'
      })
      gsap.set(kredoEyebrowRef.current, { opacity: 0, y: 20 })
      gsap.set(kredoDocRef.current, { opacity: 0, y: 24 })
    },
    { scope: rootRef }
  )

  // ── Misi — label once, each card as it individually scrolls in ────────────
  const revealMisiLabel = contextSafe(() => {
    gsap.to(misiLabelRef.current, { opacity: 1, duration: 0.4 })
  })
  useSectionReveal(misiSectionRef, revealMisiLabel)

  const revealMisiCards = contextSafe((elements: HTMLElement[]) => {
    gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power3.out'
    })
  })
  useBatchedItemReveal(misiSectionRef, '.misi-card', revealMisiCards)

  // ── Prinsip — eyebrow once, each principle as it individually scrolls in ──
  const revealPrinsipEyebrow = contextSafe(() => {
    gsap.to(prinsipEyebrowRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    })
  })
  useSectionReveal(prinsipSectionRef, revealPrinsipEyebrow)

  // Cinema-curtain reveal: the frame's clip-path opens from a closed sliver
  // at center, then settles into a slow one-way Ken Burns drift; the title
  // card fades in once the screen is mostly exposed.
  const revealPrinsipItem = contextSafe((el: HTMLElement) => {
    const frame = el.querySelector<HTMLElement>('.prinsip-item-frame')
    const text = el.querySelector<HTMLElement>('.prinsip-item-text')

    const tl = gsap.timeline()
    if (frame) {
      // fromTo (not to) so GSAP interpolates between two explicit 4-value
      // inset() strings — reading the "from" value back off computed style
      // returns a browser-normalized 2-value shorthand that doesn't pair up
      // with the 4-value target and opens asymmetrically instead of centered.
      tl.fromTo(
        frame,
        { clipPath: 'inset(0% 50% 0% 50%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power4.inOut' },
        0
      ).to(frame, { scale: 1, duration: 6, ease: 'power1.out' }, 0)
    }
    if (text) {
      tl.to(
        text,
        { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' },
        0.45
      )
    }
  })
  useItemReveal(prinsipSectionRef, '.prinsip-item', revealPrinsipItem)

  // ── Paradigma — eyebrow once, each paradigm as it individually scrolls in ─
  const revealParadigmaEyebrow = contextSafe(() => {
    gsap.to(paradigmaEyebrowRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out'
    })
  })
  useSectionReveal(paradigmaSectionRef, revealParadigmaEyebrow)

  const revealParadigmaItems = contextSafe((elements: HTMLElement[]) => {
    const copies = elements.flatMap((el) =>
      Array.from(el.querySelectorAll<HTMLElement>('.paradigma-copy'))
    )
    const photos = elements.flatMap((el) =>
      Array.from(el.querySelectorAll<HTMLElement>('.paradigma-photo'))
    )

    gsap
      .timeline({ defaults: { ease: 'power3.out' } })
      .to(copies, { autoAlpha: 1, x: 0, duration: 0.55, stagger: 0.14 })
      .to(
        photos,
        {
          autoAlpha: 1,
          x: 0,
          rotation: 0,
          duration: 0.75,
          stagger: 0.14,
          ease: 'power4.out'
        },
        '<0.12'
      )
  })
  useBatchedItemReveal(
    paradigmaSectionRef,
    '.paradigma-item',
    revealParadigmaItems
  )

  // ── Kredo — eyebrow + full document fade up together, once ────────────────
  const revealKredo = contextSafe(() => {
    gsap
      .timeline()
      .to(kredoEyebrowRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      })
      .to(
        kredoDocRef.current,
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' },
        '-=0.25'
      )
  })
  useSectionReveal(kredoSectionRef, revealKredo)

  return (
    <div ref={rootRef} className='relative w-full'>
      {/* Hero */}
      <div
        className='relative h-svh w-full overflow-hidden'
        style={{
          backgroundColor: DARK,
          ...(settings.heroImageUrl && {
            backgroundImage: `url(${settings.heroImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          })
        }}
      >
        <div className='absolute inset-0 bg-black/60' aria-hidden='true' />
        <TentangHero />
      </div>

      {/* Visi */}
      <VisiSection />

      {/* Misi */}
      <div ref={misiSectionRef} id='misi' className='bg-primary relative pt-24'>
        {/* Sticky title — sticks below the navbar while Misi is in view,
            blended via a primary-tinted scrim instead of a hard-edged
            opaque bar. In normal flow (not overlaid): cards scroll past
            underneath it later, and an overlaid semi-transparent bar would
            ghost against their white tops. */}
        <div className='from-primary via-primary to-primary/0 sticky top-20 z-40 bg-linear-to-b pb-6'>
          <p
            ref={misiLabelRef}
            className='px-6 pt-4 text-center font-sans text-sm font-semibold tracking-widest text-white/70 uppercase lg:px-8'
          >
            Misi KAMMI
          </p>
        </div>

        <div className='mx-auto max-w-6xl px-6 pt-4 pb-10 lg:px-8'>
          <div className='flex flex-wrap justify-center gap-6'>
            {MISI_ITEMS.map((item, i) => (
              <div
                key={i}
                className='misi-card flex aspect-3/4 w-full flex-col rounded-4xl bg-white p-7 shadow-md ring-1 ring-black/5 sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]'
                style={{ transform: `rotate(${CARD_ROTATIONS[i]}deg)` }}
              >
                <div className='flex items-center justify-between'>
                  <span className='text-primary/40 font-sans text-[0.6rem] font-bold tracking-[0.2em] uppercase'>
                    KAMMI
                  </span>
                  <span className='text-foreground/25 font-mono text-[0.6rem] tabular-nums'>
                    {String(i + 1).padStart(2, '0')}&thinsp;/&thinsp;05
                  </span>
                </div>
                <div className='flex flex-1 items-center'>
                  <p className='font-heading text-foreground text-[clamp(1.25rem,2.6vw,1.75rem)] leading-snug font-bold'>
                    {item}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prinsip */}
      <div
        ref={prinsipSectionRef}
        id='prinsip'
        className='bg-background relative'
      >
        {/* Sticky title — sticks below the navbar while Prinsip is in view.
            No solid backing: the frames are photos, not a flat section
            color, so the label blends into whatever frame sits underneath
            via a dark scrim instead of sitting on its own opaque bar.
            -mb-20 collapses its own flow height back to 0 so it overlays
            the first frame from the very top instead of pushing it down
            (which would expose the section's plain background beneath the
            scrim's transparent tail before any frame gets there). */}
        <div className='pointer-events-none sticky top-20 z-40 -mb-20 flex h-20 items-center justify-center bg-linear-to-b from-black/70 via-black/25 to-transparent'>
          <p
            ref={prinsipEyebrowRef}
            className='px-6 text-center font-sans text-sm font-semibold tracking-widest text-white/85 uppercase lg:px-8'
          >
            Prinsip Gerakan KAMMI
          </p>
        </div>

        <div>
          {PRINSIP_ITEMS.map((item, i) => (
            <div
              key={item.num}
              className='prinsip-item bg-muted grid w-full overflow-hidden'
              style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}
            >
              {/* Frame — clip-path-wiped open on reveal, then a slow one-way
                  Ken Burns drift back down to scale 1 while it's in view.
                  The 2.35:1 ratio lives here (not on the grid container) so
                  it's only a size *contribution*: grid auto-row-sizing takes
                  the max of this and the title card's natural height, then
                  stretches both — a title card that needs more room grows
                  the row (and the image with it) instead of getting clipped. */}
              <div
                className='prinsip-item-frame relative z-0'
                style={{ gridArea: '1 / 1', aspectRatio: '2.35 / 1' }}
              >
                {settings.prinsipImages[i] ? (
                  <Image
                    src={settings.prinsipImages[i]}
                    alt=''
                    fill
                    sizes='100vw'
                    className='object-cover'
                    unoptimized={settings.prinsipImages[i].startsWith('http')}
                  />
                ) : (
                  <div
                    className='absolute inset-0'
                    style={{
                      background: `linear-gradient(155deg, oklch(0.45 0.06 ${17 + i * 28}), oklch(0.2 0.03 ${17 + i * 28}))`
                    }}
                  />
                )}
              </div>

              {/* Explicitly sits above the frame and below the copy, so image
                  brightness can never compete with the title. */}
              <div
                className='relative z-10 bg-black/65'
                style={{ gridArea: '1 / 1' }}
                aria-hidden='true'
              />

              {/* Title card — centered over the frame */}
              <div
                className='relative z-20 flex flex-col items-center justify-center px-6 py-6 text-center lg:px-8'
                style={{ gridArea: '1 / 1' }}
              >
                <div className='prinsip-item-text w-full max-w-4xl'>
                  <span className='mb-3 block font-mono text-sm tracking-widest text-white/45 tabular-nums'>
                    {item.num}
                    <span className='text-white/25'> / 06</span>
                  </span>
                  <h2 className='font-heading text-[clamp(1.35rem,3.4vw,2.5rem)] leading-tight font-bold text-white'>
                    <Marker opacity={0.55}>{item.x}</Marker>
                    <span className='font-normal text-white/70'> adalah </span>
                    <Underline>{item.y}</Underline>
                    <span className='font-normal text-white/70'> KAMMI</span>
                  </h2>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paradigma */}
      <div
        ref={paradigmaSectionRef}
        id='paradigma'
        className='relative pb-24 lg:pb-32'
        style={{ backgroundColor: DARK }}
      >
        {/* Sticky title — blended via a dark-tinted scrim instead of a
            hard-edged opaque bar. In normal flow (not overlaid): item text
            scrolls past underneath it later, and an overlaid
            semi-transparent bar would ghost against it. */}
        <div
          className='sticky top-20 z-40 pb-6'
          style={{
            backgroundImage: `linear-gradient(to bottom, ${DARK}, ${DARK}, transparent)`
          }}
        >
          <p
            ref={paradigmaEyebrowRef}
            className='text-primary px-6 pt-4 text-center font-sans text-sm font-semibold tracking-widest uppercase lg:px-8'
          >
            Paradigma Gerakan KAMMI
          </p>
        </div>

        <div className='mx-auto max-w-6xl px-6 pt-8 lg:px-8'>
          <div className='space-y-20'>
            {PARADIGMA_ITEMS.map((item, i) => (
              <div
                key={item.num}
                className='paradigma-item grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16'
              >
                <div className='paradigma-copy text-center lg:text-left'>
                  <span className='font-mono text-sm tracking-widest text-white/35 tabular-nums'>
                    {item.num}
                    <span className='text-white/20'> / 04</span>
                  </span>
                  <h2
                    className='font-heading mt-4 text-[clamp(1.75rem,3.6vw,3rem)] leading-[1.15] font-bold hyphens-auto text-white'
                    lang='id'
                  >
                    KAMMI adalah gerakan{' '}
                    <Marker opacity={0.55}>{item.n}</Marker>
                  </h2>
                </div>

                <div className='paradigma-photo flex justify-center lg:justify-end'>
                  <figure className='w-[min(84vw,30rem)] bg-[oklch(0.93_0.01_85)] p-3 shadow-2xl lg:w-full'>
                    <div className='relative aspect-video w-full'>
                      {settings.paradigmaImages[i] ? (
                        <Image
                          src={settings.paradigmaImages[i]}
                          alt=''
                          fill
                          sizes='(max-width: 1024px) 84vw, 34rem'
                          className='object-cover'
                          unoptimized={settings.paradigmaImages[i].startsWith(
                            'http'
                          )}
                        />
                      ) : (
                        <div
                          className='absolute inset-0'
                          style={{
                            background: `linear-gradient(150deg, oklch(0.5 0.08 ${17 + i * 22}), oklch(0.24 0.04 ${17 + i * 22}))`
                          }}
                        />
                      )}
                    </div>
                  </figure>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kredo */}
      <div
        ref={kredoSectionRef}
        id='kredo'
        className='relative py-24 lg:py-32'
        style={{ backgroundColor: PARCHMENT }}
      >
        {/* Sticky title — blended via a parchment-tinted scrim instead of
            a hard-edged opaque bar. In normal flow (not overlaid): the
            kredo text scrolls past underneath it later, and an overlaid
            semi-transparent bar would ghost against it. */}
        <div
          className='sticky top-20 z-40 pb-6'
          style={{
            backgroundImage: `linear-gradient(to bottom, ${PARCHMENT}, ${PARCHMENT}, transparent)`
          }}
        >
          <p
            ref={kredoEyebrowRef}
            className='text-primary px-6 pt-4 text-center font-sans text-sm font-semibold tracking-widest uppercase lg:px-8'
          >
            Kredo Gerakan KAMMI
          </p>
        </div>

        <div
          ref={kredoDocRef}
          className='mx-auto w-full max-w-3xl px-6 pt-8 lg:px-8'
        >
          {KREDO_ITEMS.map((para, i) => (
            <div key={i}>
              {i > 0 && (
                <div className='my-12 flex justify-center' aria-hidden='true'>
                  <span className='bg-primary/40 h-px w-20' />
                </div>
              )}
              <div className='relative'>
                {/* Numeral watermark — decorative only, so aria-hidden and
                    out of the DOM's selectable text flow. -z-10 (with the
                    sibling <p> left at the default z-index:auto stacking
                    level) keeps it painted behind the paragraph regardless
                    of source order. Color is DARK (rgb(31,24,26), see the
                    sRGB note above) at 8% alpha — legible as a faint
                    watermark against PARCHMENT without competing with the
                    text; the dead kredo-section's text-white/[0.03] would
                    be invisible here since white doesn't read against a
                    light parchment background. */}
                <span
                  aria-hidden='true'
                  className='font-heading pointer-events-none absolute -top-6 left-0 -z-10 text-[clamp(4.5rem,12vw,8rem)] leading-none font-bold select-none sm:-top-8 sm:-left-4'
                  style={{ color: 'rgba(31, 24, 26, 0.08)' }}
                >
                  {i + 1}
                </span>
                <p
                  className='relative text-[clamp(1.1rem,2.2vw,1.5rem)] leading-[1.6] text-[oklch(0.26_0.02_30)]'
                  style={{ fontFamily: 'var(--font-handwriting)' }}
                >
                  {para}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
