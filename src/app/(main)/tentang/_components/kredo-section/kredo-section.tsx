'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const KREDO_ITEMS = [
  {
    numeral: 'I',
    paragraphs: [
      'Kami adalah orang-orang yang berpikir dan berkendak merdeka. Tidak ada satu orang pun yang bisa memaksa kami bertindak. Kami hanya bertindak atas dasar pemahaman, bukan taklid, serta atas dasar keikhlasan, bukan mencari pujian atau kedudukan.'
    ]
  },
  {
    numeral: 'II',
    paragraphs: [
      'Kami adalah orang-orang pemberani. Hanyalah Allah yang kami takuti. Tidak ada satu makhluk pun yang bisa menggentarkan hati kami, atau membuat kami tertunduk apalagi takluk kepadanya. Tiada yang kami takuti, kecuali ketakutan kepada-Nya.'
    ]
  },
  {
    numeral: 'III',
    paragraphs: [
      'Kami adalah para petarung sejati. Atas nama al-haq kami bertempur, sampai tidak ada lagi fitnah di muka bumi ini. Kami bukan golongan orang yang melarikan diri dari medan pertempuran atau orang-orang yang enggan pergi berjihad. Kami akan memenangkan setiap pertarungan dengan menegakkan prinsip-prinsip Islam.'
    ]
  },
  {
    numeral: 'IV',
    paragraphs: [
      'Kami adalah penghitung risiko yang cermat, tetapi kami bukanlah orang-orang yang takut mengambil risiko. Syahid adalah kemuliaan dan cita-cita tertinggi kami. Kami adalah para perindu surga. Kami akan menyebarkan aromanya di dalam kehidupan keseharian kami kepada suasana lingkungan kami. Hari-hari kami senantiasa dihiasi dengan tilawah, zikir, saling menasihati dalam kebenaran dan kesabaran, diskusi-diskusi yang bermanfaat dan jauh dari kesia-siaan, serta kerja-kerja yang konkret bagi perbaikan masyarakat.',
      'Kami adalah putra-putri kandung dakwah, akan beredar bersama dakwah ini ke mana pun perginya, menjadi pembangunnya yang paling tekun, menjadi penyebarnya yang paling agresif, serta penegaknya yang paling kukuh.'
    ]
  },
  {
    numeral: 'V',
    paragraphs: [
      'Kami adalah orang-orang yang senantiasa menyiapkan diri untuk masa depan Islam. Kami bukanlah orang yang suka berleha-leha, minimalis dan loyo. Kami senantiasa bertebaran di dalam kehidupan, melakukan eksperimen yang terencana, dan kami adalah orang-orang progressif yang bebas dari kejumudan, karena kami memandang bahwa kehidupan ini adalah tempat untuk belajar, agar kami dan para penerus kami menjadi perebut kemenangan yang hanya akan kami persembahkan untuk Islam.'
    ]
  },
  {
    numeral: 'VI',
    paragraphs: [
      'Kami adalah ilmuwan yang tajam analisisnya, pemuda yang kritis terhadap kebatilan, politisi yang piawai mengalahkan muslihat musuh dan yang piawai dalam memperjuangkan kepentingan umat, seorang pejuang di siang hari dan rahib di malam hari, pemimpin yang bermoral, teguh pada prinsip dan mampu mentransformasikan masyarakat, guru yang mampu memberikan kepahaman dan teladan, sahabat yang tulus dan penuh kasih sayang, relawan yang mampu memecahkan masalah sosial, warga yang ramah kepada masyarakatnya dan responsif terhadap masalah mereka, manajer yang efektif dan efisien, prajurit yang gagah berani dan pintar bersiasat, diplomat yang terampil berdialog, piawai berwacana, luas pergaulannya, percaya diri yang tinggi, semangat yang berkobar tinggi.'
    ]
  }
]

export const KredoSection = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!containerRef.current || !trackRef.current) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      gsap.registerPlugin(ScrollTrigger)

      const mm = gsap.matchMedia()

      mm.add('(min-width: 768px)', () => {
        const totalScroll = trackRef.current!.scrollWidth - window.innerWidth

        const kredoTween = gsap.to(trackRef.current, {
          x: -totalScroll,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: `+=${totalScroll}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        })

        const panels = trackRef.current!.querySelectorAll('[data-kredo-panel]')
        panels.forEach((panel) => {
          const content = panel.querySelector('[data-kredo-content]')
          if (!content) return
          gsap.from(content, {
            opacity: 0,
            y: 30,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: panel,
              containerAnimation: kredoTween as gsap.core.Tween,
              start: 'left 85%',
              toggleActions: 'play none none reverse'
            }
          })
        })
      })
    },
    { scope: containerRef }
  )

  return (
    <section
      id='kredo'
      aria-labelledby='kredo-heading'
      className='bg-[oklch(0.12_0.005_285)]'
    >
      <div ref={containerRef} className='overflow-hidden'>
        <div ref={trackRef} className='flex flex-col md:flex-row'>
          {KREDO_ITEMS.map((kredo, i) => (
            <div
              key={kredo.numeral}
              data-kredo-panel
              className='relative flex min-h-screen w-full shrink-0 flex-col justify-center px-8 py-20 md:w-screen md:px-16 lg:px-24'
              aria-label={`Kredo ${kredo.numeral}`}
            >
              <span
                className='font-heading pointer-events-none absolute top-1/2 right-8 -translate-y-1/2 text-[clamp(10rem,22vw,20rem)] leading-none font-bold text-white/[0.03] select-none'
                aria-hidden='true'
              >
                {kredo.numeral}
              </span>

              <div data-kredo-content className='relative max-w-3xl'>
                {i === 0 && (
                  <p
                    id='kredo-heading'
                    className='text-primary mb-8 font-sans text-xs font-semibold tracking-widest uppercase'
                  >
                    Kredo KAMMI
                  </p>
                )}

                <div className='mb-6 flex items-center gap-4'>
                  <span className='font-heading text-primary/60 text-5xl font-bold lg:text-6xl'>
                    {kredo.numeral}
                  </span>
                  <span className='font-sans text-xs text-white/25'>
                    {String(i + 1).padStart(2, '0')} /{' '}
                    {String(KREDO_ITEMS.length).padStart(2, '0')}
                  </span>
                </div>

                <span
                  className='font-heading text-primary/50 block text-[5rem] leading-none lg:text-[6rem]'
                  aria-hidden='true'
                >
                  &ldquo;
                </span>

                <div className='mt-2 space-y-5'>
                  {kredo.paragraphs.map((para, j) => (
                    <p
                      key={j}
                      className='font-heading text-lg leading-snug font-bold text-white lg:text-xl'
                    >
                      {para}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
