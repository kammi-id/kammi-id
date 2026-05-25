import Link from 'next/link'

export const CtaSection = () => {
  return (
    <section
      className='bg-primary py-24 lg:py-32'
      aria-labelledby='cta-heading'
      id='bergabung'
    >
      <div className='mx-auto max-w-3xl px-6 text-center lg:px-8'>
        <h2
          id='cta-heading'
          className='font-heading text-primary-foreground text-[clamp(2rem,5vw,3.5rem)] leading-tight font-bold'
        >
          Siap Menjadi Pelopor?
        </h2>
        <p className='text-primary-foreground/80 mt-4 font-sans text-base leading-relaxed md:text-lg'>
          Bergabunglah dengan ribuan mahasiswa muslim Indonesia. Mari
          bersama-sama mewujudkan Indonesia yang lebih baik, lebih adil, dan
          lebih sejahtera.
        </p>
        <div className='mt-10 flex flex-wrap justify-center gap-4'>
          <Link
            href='#'
            className='bg-primary-foreground text-primary hover:bg-primary-foreground/90 inline-flex h-11 items-center justify-center rounded-full px-6 font-sans text-sm font-semibold transition-all'
          >
            Daftar Sekarang
          </Link>
          <Link
            href='#tentang'
            className='border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 inline-flex h-11 items-center justify-center rounded-full border px-6 font-sans text-sm font-semibold transition-all'
          >
            Tentara Aktif
          </Link>
        </div>
      </div>
    </section>
  )
}
