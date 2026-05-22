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
          className='font-heading text-[clamp(2rem,5vw,3.5rem)] font-bold leading-tight text-primary-foreground'
        >
          Siap Menjadi Pelopor?
        </h2>
        <p className='mt-4 font-sans text-base leading-relaxed text-primary-foreground/80 md:text-lg'>
          Bergabunglah dengan ribuan mahasiswa muslim Indonesia. Mari
          bersama-sama mewujudkan Indonesia yang lebih baik, lebih adil, dan
          lebih sejahtera.
        </p>
        <div className='mt-10 flex flex-wrap justify-center gap-4'>
          <Link
            href='#'
            className='inline-flex h-11 items-center justify-center rounded-full bg-primary-foreground px-6 font-sans text-sm font-semibold text-primary transition-all hover:bg-primary-foreground/90'
          >
            Daftar Sekarang
          </Link>
          <Link
            href='#tentang'
            className='inline-flex h-11 items-center justify-center rounded-full border border-primary-foreground/40 px-6 font-sans text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/10'
          >
            Tentara Aktif
          </Link>
        </div>
      </div>
    </section>
  )
}
