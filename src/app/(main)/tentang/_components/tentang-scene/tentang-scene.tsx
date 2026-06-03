'use client'

import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TentangHero } from '../tentang-hero'
import { VisiSection } from '../visi-section'
import { $tentangPhase, $tentangPhaseScrollY } from './store'
import type { TentangSettings } from '~/db/query/site-settings'

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

// Counter-clockwise rotations per card (negative = CCW), range 0–10°
const CARD_ROTATIONS = [-7, -3, -9, -1, -5] as const

// Each card flies off toward a distinct corner so the stack "buyar" outward.
const CARD_SCATTER = [
  { x: '-125vw', y: '-55vh', rotation: -160 },
  { x: '125vw', y: '-65vh', rotation: 150 },
  { x: '-115vw', y: '75vh', rotation: -200 },
  { x: '130vw', y: '85vh', rotation: 190 },
  { x: '5vw', y: '-135vh', rotation: 100 }
] as const

// sRGB values (not oklch) keep GSAP's color tween in sRGB space, so each cut
// passes only through clean intermediate hues, never the muddy yellow/blue that
// oklch interpolation produces. Each maps to an oklch design token:
const MAROON = 'rgb(193, 19, 61)' //   oklch(0.52 0.20 17)  — Vanguard Crimson
const WHITE = '#ffffff'
const DARK = 'rgb(31, 24, 26)' //       oklch(0.18 0.012 17) — warm near-black
const PARCHMENT = 'rgb(244, 240, 231)' // oklch(0.96 0.012 85) — manuscript paper

export const TentangScene = ({ settings }: { settings: TentangSettings }) => {
  const sceneRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const visiRef = useRef<HTMLDivElement>(null)
  const misiRef = useRef<HTMLDivElement>(null)
  const prinsipRef = useRef<HTMLDivElement>(null)
  const paradigmaRef = useRef<HTMLDivElement>(null)
  const kredoRef = useRef<HTMLDivElement>(null)
  const kredoDocRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger)

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Convert from scroll-pinned experience to linear flow so sighted users
        // who disable motion can still read all content sections.
        gsap.set(sceneRef.current, { height: 'auto', overflow: 'visible' })

        ;[heroRef, visiRef, misiRef, prinsipRef, paradigmaRef, kredoRef].forEach(
          (ref) => {
            if (!ref.current) return
            gsap.set(ref.current, {
              position: 'relative',
              inset: 'unset',
              width: '100%',
              height: 'auto',
              minHeight: '100svh',
              opacity: 1,
              pointerEvents: 'auto',
              zIndex: 'auto'
            })
          }
        )

        gsap.set(visiRef.current, { backgroundColor: MAROON })
        gsap.set(prinsipRef.current, { backgroundColor: WHITE })
        gsap.set(paradigmaRef.current, { backgroundColor: DARK })
        gsap.set(kredoRef.current, { backgroundColor: PARCHMENT })

        // Visi
        gsap.set(['.visi-title', '.visi-text'], { opacity: 1 })

        // Misi — all cards visible; top card (highest z-index) is readable
        gsap.set('.misi-scene-label', { opacity: 1 })
        gsap.set('.misi-scene-card', { opacity: 1, x: 0 })

        // Prinsip — convert stacked absolute items to flow layout
        gsap.set('.prinsip-eyebrow', { opacity: 1 })
        const prinsipStack = sceneRef.current?.querySelector(
          '[data-id="prinsip-stack"]'
        ) as HTMLElement | null
        if (prinsipStack) gsap.set(prinsipStack, { height: 'auto' })
        PRINSIP_ITEMS.forEach((_, i) => {
          gsap.set(`.prinsip-point-${i}`, {
            position: 'relative',
            inset: 'unset',
            opacity: 1,
            y: 0,
            paddingTop: '3rem',
            paddingBottom: '3rem'
          })
        })

        // Paradigma — convert stacked items to flow layout, inject images
        gsap.set('.paradigma-eyebrow', { opacity: 1 })
        const paradigmaStack = sceneRef.current?.querySelector(
          '[data-id="paradigma-stack"]'
        ) as HTMLElement | null
        if (paradigmaStack) gsap.set(paradigmaStack, { height: 'auto' })
        PARADIGMA_ITEMS.forEach((_, i) => {
          gsap.set(`.paradigma-text-${i}`, {
            position: 'relative',
            inset: 'unset',
            opacity: 1,
            y: 0,
            paddingTop: i === 0 ? '3rem' : '1.5rem',
            paddingBottom: '1.5rem'
          })
          gsap.set(`.paradigma-photo-${i}`, {
            position: 'relative',
            inset: 'unset',
            opacity: 1,
            y: 0
          })
          // Inject image now (deferred for normal path via GSAP call)
          const photoInner = sceneRef.current?.querySelector(
            `[data-photo="paradigma-${i}"]`
          ) as HTMLElement | null
          if (photoInner) {
            photoInner.style.backgroundImage = settings.paradigmaImages[i]
              ? `url(${settings.paradigmaImages[i]})`
              : `linear-gradient(150deg, oklch(0.5 0.08 ${17 + i * 22}), oklch(0.24 0.04 ${17 + i * 22}))`
          }
        })

        // Kredo — remove scroll mask so full text is visible without scrolling
        gsap.set('.kredo-eyebrow', { opacity: 1 })
        const kredoMask = sceneRef.current?.querySelector(
          '[data-id="kredo-mask"]'
        ) as HTMLElement | null
        if (kredoMask) {
          gsap.set(kredoMask, {
            maskImage: 'none',
            WebkitMaskImage: 'none',
            overflow: 'visible',
            height: 'auto',
            position: 'relative'
          })
        }
        gsap.set(kredoDocRef.current, {
          opacity: 1,
          y: 0,
          paddingTop: '3rem',
          paddingBottom: '4rem',
          position: 'relative'
        })

        return
      }

      // Set per-card rotations before the timeline so GSAP owns the transform.
      // Not included in fromTo so they persist unchanged through the entrance.
      CARD_ROTATIONS.forEach((deg, i) => {
        const card = sceneRef.current?.querySelectorAll('.misi-scene-card')[i]
        if (card) gsap.set(card, { rotation: deg })
      })

      const mainTl = gsap.timeline({
        scrollTrigger: {
          id: 'tentang-main',
          trigger: sceneRef.current,
          start: 'top top',
          end: '+=1800%',
          scrub: true,
          pin: true,
          invalidateOnRefresh: true
        }
      })

      // ── Phase 1: Hero → Visi ───────────────────────────────────────────────
      // fromTo with explicit start color prevents the black flash caused by
      // GSAP failing to parse oklch values from computed CSS class styles.
      mainTl
        .addLabel('visiIn')
        .to(heroRef.current, {
          scale: 0.8,
          opacity: 0,
          duration: 1,
          ease: 'power2.inOut'
        })
        .fromTo(
          sceneRef.current,
          { backgroundColor: WHITE },
          { backgroundColor: MAROON, duration: 1, ease: 'none' },
          '<'
        )
        .set(visiRef.current, { pointerEvents: 'auto' }, '<')
        .fromTo(
          '.visi-text',
          { opacity: 0, scale: 0.8, y: 20 },
          { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'power2.inOut' },
          '-=0.7'
        )
        .to(
          '.visi-title',
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.inOut' },
          '-=0.4'
        )

        // Brief hold at Visi
        .to({}, { duration: 0.3 })

        // ── Phase 2: Visi exits → Misi enters ────────────────────────────────
        .to('.visi-title', { opacity: 0, duration: 0.3, ease: 'power2.in' })
        .to(
          '.visi-text',
          { y: '-40vh', opacity: 0, duration: 0.6, ease: 'power2.in' },
          '-=0.15'
        )
        .addLabel('misiIn')
        .set(misiRef.current, { pointerEvents: 'auto' })
        .to('.misi-scene-label', { opacity: 1, duration: 0.4, ease: 'power2.out' })
        // Cards slide in one by one; stagger > duration so each lands fully
        // before the next leaves the right edge.
        .fromTo(
          '.misi-scene-card',
          { x: '110vw', opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.55,
            stagger: 0.7,
            ease: 'power3.out'
          },
          '-=0.2'
        )

        // Hold on the full stack
        .to({}, { duration: 0.6 })

        // ── Phase 3: Misi exits (cards scatter) → background back to white ───
        .addLabel('misiOut')
        .to(
          '.misi-scene-label',
          { opacity: 0, duration: 0.4, ease: 'power2.in' },
          'misiOut'
        )
        .to(
          '.misi-scene-card',
          {
            x: (i) => CARD_SCATTER[i].x,
            y: (i) => CARD_SCATTER[i].y,
            rotation: (i) => CARD_SCATTER[i].rotation,
            opacity: 0,
            duration: 0.9,
            stagger: 0.04,
            ease: 'power2.in'
          },
          'misiOut'
        )
        // Hard, hue-clean cut back to white (linear, sRGB interpolation).
        .to(
          sceneRef.current,
          { backgroundColor: WHITE, duration: 0.6, ease: 'none' },
          'misiOut+=0.3'
        )
        .set(misiRef.current, { pointerEvents: 'none' })

        // ── Phase 4: Prinsip enters ──────────────────────────────────────────
        .addLabel('prinsipIn')
        .set(prinsipRef.current, { pointerEvents: 'auto' }, 'prinsipIn')
        .fromTo(
          '.prinsip-eyebrow',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
          'prinsipIn'
        )

      // Inject prinsip background images lazily — fires once when section enters.
      // All 6 URLs would otherwise load eagerly on mount before the user sees them.
      mainTl.call(
        () => {
          PRINSIP_ITEMS.forEach((_, i) => {
            const el = sceneRef.current?.querySelector(
              `.prinsip-photo-${i}`
            ) as HTMLElement | null
            if (!el) return
            el.style.backgroundImage = settings.prinsipImages[i]
              ? `url(${settings.prinsipImages[i]})`
              : `linear-gradient(155deg, oklch(0.45 0.06 ${17 + i * 28}), oklch(0.2 0.03 ${17 + i * 28}))`
          })
        },
        undefined,
        'prinsipIn'
      )

      // Cycle through each principle.
      // Photos: pure opacity crossfade, decoupled from text movement — no yPercent.
      // Text:   slides in from below and exits upward, independent track.
      PRINSIP_ITEMS.forEach((_, i) => {
        const isFirst = i === 0
        const isLast = i === PRINSIP_ITEMS.length - 1

        // ── Photo track (opacity only) ────────────────────────────────────────
        if (isFirst) {
          // First photo fades in at section start.
          mainTl.fromTo(
            `.prinsip-photo-0`,
            { opacity: 0 },
            { opacity: 0.55, duration: 0.5, ease: 'none' },
            'prinsipIn+=0.1'
          )
        }

        // ── Text track ────────────────────────────────────────────────────────
        mainTl
          .fromTo(
            `.prinsip-point-${i}`,
            { opacity: 0, y: 60 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
            isFirst ? 'prinsipIn+=0.25' : '>'
          )
          .to({}, { duration: 0.7 })

        if (!isLast) {
          mainTl
            // Text exits upward
            .to(`.prinsip-point-${i}`, {
              opacity: 0,
              y: -60,
              duration: 0.5,
              ease: 'power2.in'
            })
            // Photos crossfade simultaneously with text exit — no y movement
            .to(
              `.prinsip-photo-${i}`,
              { opacity: 0, duration: 0.4, ease: 'none' },
              '<'
            )
            .fromTo(
              `.prinsip-photo-${i + 1}`,
              { opacity: 0 },
              { opacity: 0.55, duration: 0.4, ease: 'none' },
              '<'
            )
        }
      })

      // ── Phase 5: Prinsip exits → Paradigma enters (background to dark) ──────
      const lastPrinsip = PRINSIP_ITEMS.length - 1
      mainTl
        .addLabel('paradigmaIn')
        .to(
          `.prinsip-point-${lastPrinsip}`,
          { opacity: 0, y: -60, duration: 0.5, ease: 'power2.in' },
          'paradigmaIn'
        )
        .to(
          `.prinsip-photo-${lastPrinsip}`,
          { y: -60, opacity: 0, duration: 0.5, ease: 'power2.in' },
          '<'
        )
        .to(
          '.prinsip-eyebrow',
          { opacity: 0, duration: 0.4, ease: 'power2.in' },
          '<'
        )
        .to(
          sceneRef.current,
          { backgroundColor: DARK, duration: 0.6, ease: 'none' },
          'paradigmaIn+=0.2'
        )
        .set(prinsipRef.current, { pointerEvents: 'none' })
        .set(paradigmaRef.current, { pointerEvents: 'auto' })
        .fromTo(
          '.paradigma-eyebrow',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
        )

      // Inject paradigma background images lazily — fires once when section enters.
      mainTl.call(
        () => {
          PARADIGMA_ITEMS.forEach((_, i) => {
            const el = sceneRef.current?.querySelector(
              `[data-photo="paradigma-${i}"]`
            ) as HTMLElement | null
            if (!el) return
            el.style.backgroundImage = settings.paradigmaImages[i]
              ? `url(${settings.paradigmaImages[i]})`
              : `linear-gradient(150deg, oklch(0.5 0.08 ${17 + i * 22}), oklch(0.24 0.04 ${17 + i * 22}))`
          })
        },
        undefined,
        'paradigmaIn'
      )

      // Cycle through each paradigm: framed photo (right) + statement (left)
      // slide up in, hold, then slide up out as the next enters.
      PARADIGMA_ITEMS.forEach((_, i) => {
        const isFirst = i === 0
        const isLast = i === PARADIGMA_ITEMS.length - 1

        mainTl
          .fromTo(
            `.paradigma-photo-${i}`,
            { opacity: 0, y: 80, rotation: 1 },
            { opacity: 1, y: 0, rotation: -3, duration: 0.7, ease: 'power3.out' },
            isFirst ? 'paradigmaIn+=0.35' : '>'
          )
          .fromTo(
            `.paradigma-text-${i}`,
            { opacity: 0, y: 60 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
            '<0.1'
          )
          .to({}, { duration: 0.7 })

        if (!isLast) {
          mainTl
            .to(`.paradigma-text-${i}`, {
              opacity: 0,
              y: -60,
              duration: 0.5,
              ease: 'power2.in'
            })
            .to(
              `.paradigma-photo-${i}`,
              { opacity: 0, y: -60, duration: 0.5, ease: 'power2.in' },
              '<'
            )
        }
      })

      // ── Phase 6: Paradigma exits → Kredo (the "constitution" is written) ───
      const lastParadigma = PARADIGMA_ITEMS.length - 1
      // Distance the document travels up: from first line resting at the
      // writing line (~58vh, set via padding) until the last line clears it.
      const kredoEndY = () => {
        const doc = kredoDocRef.current
        if (!doc) return -2000
        // Stop when the last line settles just above the writing line (~50vh).
        return window.innerHeight * 0.5 - doc.scrollHeight
      }

      mainTl
        .addLabel('kredoIn')
        .to(
          `.paradigma-text-${lastParadigma}`,
          { opacity: 0, y: -60, duration: 0.5, ease: 'power2.in' },
          'kredoIn'
        )
        .to(
          `.paradigma-photo-${lastParadigma}`,
          { opacity: 0, y: -60, duration: 0.5, ease: 'power2.in' },
          '<'
        )
        .to(
          '.paradigma-eyebrow',
          { opacity: 0, duration: 0.4, ease: 'power2.in' },
          '<'
        )
        .to(
          sceneRef.current,
          { backgroundColor: PARCHMENT, duration: 0.6, ease: 'none' },
          'kredoIn+=0.2'
        )
        .set(paradigmaRef.current, { pointerEvents: 'none' })
        .set(kredoRef.current, { pointerEvents: 'auto' })
        .fromTo(
          '.kredo-eyebrow',
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
        )
        .fromTo(
          kredoDocRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'none' }
        )
        // The whole document scrolls up at constant speed. Combined with the
        // fixed reveal mask on the layer, each line "inks in" as it rises past
        // the writing line — written, top-to-bottom, paced by scroll.
        .fromTo(
          kredoDocRef.current,
          { y: 0 },
          { y: kredoEndY, duration: 11, ease: 'none' }
        )

      // ── Phase tracking: populate scroll-Y positions for SectionNav ─────────
      // Deferred two frames: first frame lets GSAP commit the timeline; second
      // lets ScrollTrigger resolve start/end pixel positions after pin setup.
      const populatePhasePositions = () => {
        const st = ScrollTrigger.getById('tentang-main')
        if (!st) return

        const totalDuration = mainTl.duration()
        const labelToScrollY = (label: string): number => {
          const t = mainTl.labels[label]
          if (t === undefined) return -1
          return st.start + (t / totalDuration) * (st.end - st.start)
        }

        const positions = [
          labelToScrollY('visiIn'),
          labelToScrollY('misiIn'),
          labelToScrollY('prinsipIn'),
          labelToScrollY('paradigmaIn'),
          labelToScrollY('kredoIn')
        ]
        $tentangPhaseScrollY.set(positions)

        // Per-phase sub-triggers to keep the active dot in sync.
        positions.forEach((scrollY, i) => {
          if (scrollY < 0) return
          const nextScrollY = positions[i + 1] ?? st.end
          ScrollTrigger.create({
            start: scrollY,
            end: nextScrollY,
            onEnter: () => $tentangPhase.set(i),
            onEnterBack: () => $tentangPhase.set(i)
          })
        })

        // Hero zone (before visiIn)
        ScrollTrigger.create({
          start: 0,
          end: positions[0] ?? 0,
          onEnter: () => $tentangPhase.set(-1),
          onEnterBack: () => $tentangPhase.set(-1)
        })
      }
      requestAnimationFrame(() => requestAnimationFrame(populatePhasePositions))

      // Recompute after all fonts load so kredoEndY reflects the real scrollHeight.
      document.fonts.ready.then(() => ScrollTrigger.refresh())
    },
    { scope: sceneRef }
  )

  return (
    <div
      ref={sceneRef}
      className='relative h-svh w-full overflow-hidden'
      style={{ backgroundColor: WHITE }}
    >
      <div
        ref={heroRef}
        className='absolute inset-0 z-10'
        style={{
          backgroundColor: DARK,
          ...(settings.heroImageUrl && {
            backgroundImage: `url(${settings.heroImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          })
        }}
      >
        {/* Dark overlay to dim the hero image so text stays legible */}
        <div className='absolute inset-0 bg-black/60' aria-hidden='true' />
        <TentangHero />
      </div>

      <div ref={visiRef} className='pointer-events-none absolute inset-0 z-20'>
        <VisiSection />
      </div>

      {/* Misi layer — cards stack centered in viewport */}
      <div
        ref={misiRef}
        className='pointer-events-none absolute inset-0 z-30'
      >
        {/* Eyebrow — sticky at top, matches other section labels */}
        <div className='absolute inset-x-0 top-[13vh] flex justify-center px-6'>
          <p className='misi-scene-label font-sans text-sm font-semibold tracking-widest text-white/70 uppercase opacity-0'>
            Misi KAMMI
          </p>
        </div>

        {/* Cards centered in viewport, shifted down to sit below the eyebrow */}
        <div className='absolute inset-0 flex items-center justify-center pt-[14vh]'>
          {/* Stack container — portrait card, fills most of the remaining viewport */}
          <div
            className='relative'
            style={{ height: 'min(74vh, 760px)', aspectRatio: '54 / 86' }}
          >
            {MISI_ITEMS.map((item, i) => (
              <div
                key={i}
                className='misi-scene-card absolute inset-0 flex flex-col rounded-3xl bg-white p-7 opacity-0 shadow-2xl'
                style={{ zIndex: i + 1 }}
              >
                <div className='flex items-center justify-between'>
                  <span className='text-primary/40 font-sans text-[0.6rem] font-bold tracking-[0.2em] uppercase'>
                    KAMMI
                  </span>
                  <span className='text-foreground/25 font-mono text-[0.6rem] tabular-nums'>
                    {String(i + 1).padStart(2, '0')}&thinsp;/&thinsp;05
                  </span>
                </div>
                <div className='flex flex-1 items-center justify-center'>
                  <p
                    className='font-heading text-foreground text-center leading-snug font-bold'
                    style={{ fontSize: 'clamp(1.05rem, 2.6vh, 1.6rem)' }}
                  >
                    {item}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Prinsip layer — one principle at a time over white, photo bottom-right */}
      <div ref={prinsipRef} className='pointer-events-none absolute inset-0 z-40'>
        {/* Background photos (placeholder; swap for real <Image> later) */}
        <div className='absolute inset-0 overflow-hidden'>
          {PRINSIP_ITEMS.map((_, i) => (
            <div
              key={i}
              className={`prinsip-photo-${i} absolute inset-0 h-full w-full opacity-0`}
              style={{
                // backgroundImage injected lazily via GSAP call at 'prinsipIn'
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                // Opacity gradient: 0 behind the text (top-left), peaking at the
                // bottom-right viewport edge. Combined with element opacity 0.55.
                maskImage:
                  'linear-gradient(315deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.25) 100%)',
                WebkitMaskImage:
                  'linear-gradient(315deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.25) 100%)'
              }}
              aria-hidden='true'
            />
          ))}
        </div>

        {/* Eyebrow — top label */}
        <div className='absolute inset-x-0 top-[13vh] flex justify-center px-6'>
          <p className='prinsip-eyebrow text-primary font-sans text-sm font-semibold tracking-widest uppercase opacity-0'>
            Prinsip Gerakan KAMMI
          </p>
        </div>

        {/* Statements — centered in viewport, one at a time */}
        <div className='absolute inset-0 flex items-center justify-center px-6 lg:px-8'>
          <div data-id='prinsip-stack' className='relative h-[52vh] w-full max-w-5xl'>
            {PRINSIP_ITEMS.map((item, i) => (
              <div
                key={item.num}
                className={`prinsip-point-${i} absolute inset-0 flex flex-col items-center justify-center text-center opacity-0`}
              >
                <span className='text-primary/50 mb-7 font-mono text-sm tracking-widest tabular-nums'>
                  {item.num}
                  <span className='text-foreground/30'> / 06</span>
                </span>
                <h2 className='font-heading text-foreground text-[clamp(2.25rem,6vw,4.75rem)] leading-[1.2] font-bold'>
                  <Marker>{item.x}</Marker>
                  <span className='text-foreground/55 font-normal'> adalah </span>
                  <Underline>{item.y}</Underline>
                  <span className='text-foreground/55 font-normal'> KAMMI</span>
                </h2>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Paradigma layer — split layout over dark: statement left, framed photo right */}
      <div ref={paradigmaRef} className='pointer-events-none absolute inset-0 z-50'>
        {/* Eyebrow — top label */}
        <div className='absolute inset-x-0 top-[13vh] flex justify-center px-6'>
          <p className='paradigma-eyebrow text-primary font-sans text-sm font-semibold tracking-widest uppercase opacity-0'>
            Paradigma Gerakan KAMMI
          </p>
        </div>

        <div className='absolute inset-0 flex items-center justify-center px-6 lg:px-12'>
          <div data-id='paradigma-stack' className='relative h-[64vh] w-full max-w-6xl'>
            {PARADIGMA_ITEMS.map((item, i) => (
              <div
                key={item.num}
                className='absolute inset-0 grid grid-cols-1 items-center gap-6 [@media(max-height:600px)]:grid-cols-[1.1fr_0.9fr] [@media(max-height:600px)]:gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16'
              >
                {/* Statement (left on desktop, first on mobile) */}
                <div
                  className={`paradigma-text-${i} order-1 text-center opacity-0 lg:text-left`}
                >
                  <span className='font-mono text-sm tracking-widest text-white/35 tabular-nums'>
                    {item.num}
                    <span className='text-white/20'> / 04</span>
                  </span>
                  <h2 className='font-heading mt-6 hyphens-auto text-[clamp(2rem,4.2vw,3.75rem)] leading-[1.1] font-bold text-white' lang='id'>
                    KAMMI adalah gerakan{' '}
                    <Marker opacity={0.55}>{item.n}</Marker>
                  </h2>
                </div>

                {/* Framed photo (right on desktop, second on mobile) */}
                <div
                  className={`paradigma-photo-${i} order-2 flex justify-center opacity-0 lg:justify-end`}
                >
                  <figure className='w-[min(84vw,30rem)] bg-[oklch(0.93_0.01_85)] p-3 shadow-2xl lg:w-[34rem]'>
                    <div
                      data-photo={`paradigma-${i}`}
                      className='aspect-video w-full'
                      style={{
                        // backgroundImage injected lazily via GSAP call at 'paradigmaIn'
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                      aria-hidden='true'
                    />
                  </figure>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kredo layer — the full text written out like a constitution over parchment */}
      <div ref={kredoRef} className='pointer-events-none absolute inset-0 z-[60]'>
        {/* Eyebrow — outside the mask so it stays sticky at top */}
        <div className='absolute inset-x-0 top-[13vh] flex justify-center px-6'>
          <p className='kredo-eyebrow text-primary font-sans text-sm font-semibold tracking-widest uppercase opacity-0'>
            Kredo Gerakan KAMMI
          </p>
        </div>

        {/* Reveal mask: text above the "nib line" (~53vh) is fully visible
            (already written). The nib zone is deliberately tight — ~4–5vh,
            roughly one line — so each new line inks in sharply rather than
            fading in from far below. A gentle fade at the top lets old text
            dissolve as it scrolls off-screen. */}
        <div
          data-id='kredo-mask'
          className='absolute inset-0 overflow-hidden'
          style={{
            maskImage:
              'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 6%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 94%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 6%, rgba(0,0,0,1) 88%, rgba(0,0,0,0) 94%)'
          }}
        >
          <div
            ref={kredoDocRef}
            className='absolute inset-x-0 top-0 mx-auto w-full max-w-3xl px-6 opacity-0 lg:px-8'
            style={{ paddingTop: '42vh', paddingBottom: '8vh' }}
          >
            {KREDO_ITEMS.map((para, i) => (
              <div key={i}>
                {i > 0 && (
                  <div className='my-12 flex justify-center' aria-hidden='true'>
                    <span className='bg-primary/40 h-px w-20' />
                  </div>
                )}
                <p
                  className='text-[clamp(1.1rem,2.6vw,2.6rem)] leading-[1.5] text-[oklch(0.26_0.02_30)]'
                  style={{ fontFamily: 'var(--font-handwriting)' }}
                >
                  {para}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
