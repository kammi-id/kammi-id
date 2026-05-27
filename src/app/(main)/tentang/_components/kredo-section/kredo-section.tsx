'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const KREDO_ITEMS = [
  {
    numeral: 'I',
    title: 'Kredo Ketuhanan',
    paragraphs: [
      'Kami percaya bahwa Allah adalah satu-satunya Tuhan yang berhak disembah, yang menciptakan alam semesta dan seluruh isinya dengan hikmah yang agung. Keyakinan ini bukan sekadar pernyataan verbal, melainkan fondasi yang menopang seluruh bangunan hidup kami.',
      'Dari keyakinan ini lahir tanggung jawab: bahwa setiap nikmat yang diterima adalah amanah, bahwa setiap kemampuan yang dimiliki adalah titipan, dan bahwa setiap keputusan yang diambil akan dimintai pertanggungjawaban di hadapan-Nya.',
      'Kami meyakini bahwa hanya dengan menempatkan Allah sebagai pusat orientasi hidup, seorang manusia dapat mencapai harkat tertingginya dan memberikan manfaat terbesar bagi sesama.',
    ],
  },
  {
    numeral: 'II',
    title: 'Kredo Kemanusiaan',
    paragraphs: [
      'Kami percaya bahwa setiap manusia adalah makhluk mulia yang ditiupkan ruh Ilahi ke dalam dirinya, terlepas dari ras, suku, bahasa, dan status sosialnya. Kemuliaan ini bukan sesuatu yang harus dibuktikan, melainkan sesuatu yang harus diakui dan dijaga.',
      'Dari keyakinan ini lahir komitmen: bahwa kami menolak segala bentuk penistaan terhadap martabat manusia, bahwa kami berpihak kepada mereka yang tertindas, dan bahwa kami berupaya menciptakan ruang di mana setiap orang dapat hidup dengan bermartabat.',
      'Kami meyakini bahwa cinta kepada sesama manusia adalah manifestasi nyata dari cinta kepada Allah yang menciptakan mereka semua.',
    ],
  },
  {
    numeral: 'III',
    title: 'Kredo Keislaman',
    paragraphs: [
      'Kami percaya bahwa Islam adalah agama yang sempurna, risalah terakhir yang Allah turunkan untuk menjadi rahmat bagi seluruh alam. Islam bukan warisan budaya yang kami terima secara pasif, melainkan komitmen hidup yang kami pilih secara sadar.',
      'Dari keyakinan ini lahir tanggung jawab: bahwa kami harus memahami Islam secara utuh dan mendalam, bahwa kami harus mempraktikkannya dalam seluruh dimensi kehidupan, dan bahwa kami harus mendakwahkannya dengan hikmah dan teladan yang baik.',
      'Kami meyakini bahwa seorang Muslim sejati adalah mereka yang keislamannya membawa kebaikan tidak hanya bagi dirinya, tetapi bagi seluruh makhluk di sekitarnya.',
    ],
  },
  {
    numeral: 'IV',
    title: 'Kredo Pergerakan',
    paragraphs: [
      'Kami percaya bahwa iman yang sejati selalu berbuah amal, bahwa keyakinan yang tulus selalu mendorong kepada pergerakan. Diam di hadapan ketidakadilan adalah pengkhianatan terhadap iman itu sendiri.',
      'Dari keyakinan ini lahir komitmen: bahwa kami tidak akan membatasi diri pada ranah privat saja, bahwa kami akan hadir di ruang-ruang publik dengan kontribusi nyata, dan bahwa kami akan terus bergerak selama masih ada kebaikan yang harus ditegakkan.',
      'Kami meyakini bahwa pergerakan yang benar adalah pergerakan yang berlandaskan ilmu, berorientasi pada perubahan yang membawa maslahat, dan senantiasa dalam bingkai ketaatan kepada Allah.',
    ],
  },
  {
    numeral: 'V',
    title: 'Kredo Kebangsaan',
    paragraphs: [
      'Kami percaya bahwa Indonesia adalah amanah Allah yang dipercayakan kepada kami. Tanah ini, dengan seluruh kekayaan dan keberagamannya, adalah ladang pengabdian yang harus kami rawat dan perjuangkan dengan sepenuh jiwa.',
      'Dari keyakinan ini lahir cinta: bahwa kami mencintai Indonesia bukan karena ia sempurna, melainkan karena ia adalah rumah bagi saudara-saudara kami yang perlu diperjuangkan masa depannya.',
      'Kami meyakini bahwa seorang Muslim yang baik akan menjadi warga negara yang baik, dan seorang warga negara yang baik akan memberikan kontribusi terbaik bagi terwujudnya Indonesia yang adil, makmur, dan bermartabat.',
    ],
  },
  {
    numeral: 'VI',
    title: 'Kredo Kemahasiswaan',
    paragraphs: [
      'Kami percaya bahwa masa muda adalah waktu terbaik untuk menanamkan nilai, membangun karakter, dan meletakkan fondasi bagi kehidupan yang bermakna. Kampus adalah laboratorium kehidupan, tempat ide-ide besar lahir dan diuji.',
      'Dari keyakinan ini lahir semangat: bahwa kami tidak akan menyia-nyiakan masa muda, bahwa kami akan menggunakan platform kemahasiswaan untuk membawa perubahan nyata, dan bahwa kami akan menjaga marwah intelektual sebagai modal terbesar kaum muda.',
      'Kami meyakini bahwa mahasiswa yang baik bukan hanya mereka yang unggul secara akademik, melainkan mereka yang mengintegrasikan kecerdasan intelektual dengan kecerdasan moral dan kepekaan sosial yang tinggi.',
    ],
  },
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
            invalidateOnRefresh: true,
          },
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
              toggleActions: 'play none none reverse',
            },
          })
        })
      })
    },
    { scope: containerRef },
  )

  return (
    <section
      id="kredo"
      aria-labelledby="kredo-heading"
      className="bg-[oklch(0.12_0.005_285)]"
    >
      <div ref={containerRef} className="overflow-hidden">
        <div
          ref={trackRef}
          className="flex flex-col md:flex-row"
        >
          {KREDO_ITEMS.map((kredo, i) => (
            <div
              key={kredo.numeral}
              data-kredo-panel
              className="relative flex min-h-screen w-full shrink-0 flex-col justify-center px-8 py-20 md:w-screen md:px-16 lg:px-24"
              aria-label={`Kredo ${kredo.numeral}: ${kredo.title}`}
            >
              <span
                className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 select-none font-heading text-[clamp(10rem,22vw,20rem)] font-bold leading-none text-white/[0.03]"
                aria-hidden="true"
              >
                {kredo.numeral}
              </span>

              <div data-kredo-content className="relative max-w-2xl">
                {i === 0 && (
                  <p
                    id="kredo-heading"
                    className="mb-8 font-sans text-xs font-semibold uppercase tracking-widest text-primary"
                  >
                    Kredo KAMMI
                  </p>
                )}

                <div className="mb-6 flex items-center gap-4">
                  <span className="font-heading text-5xl font-bold text-primary/60 lg:text-6xl">
                    {kredo.numeral}
                  </span>
                  <span className="font-sans text-xs text-white/25">
                    {String(i + 1).padStart(2, '0')} / {String(KREDO_ITEMS.length).padStart(2, '0')}
                  </span>
                </div>

                <h2 className="font-heading text-2xl font-bold leading-snug text-white lg:text-3xl">
                  {kredo.title}
                </h2>

                <div className="mt-5 h-px w-12 bg-primary/40" aria-hidden="true" />

                <div className="mt-6 space-y-4">
                  {kredo.paragraphs.map((para, j) => (
                    <p
                      key={j}
                      className="font-sans text-sm leading-relaxed text-white/55 lg:text-base"
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
