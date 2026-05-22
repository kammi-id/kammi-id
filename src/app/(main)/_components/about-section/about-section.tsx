import Link from 'next/link'
import { getAboutSettings } from '~/app/(main)/_data/site-settings'

export const AboutSection = async () => {
  const about = await getAboutSettings()

  return (
    <section
      id='tentang'
      className='bg-background py-20 lg:py-28'
      aria-labelledby='about-heading'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-12 lg:grid-cols-[1fr_340px] xl:gap-20'>

          {/* Left: About text */}
          <div>
            <h2
              id='about-heading'
              className='font-heading text-[clamp(1.5rem,3vw,2rem)] font-bold text-foreground'
            >
              Tentang KAMMI
            </h2>
            <div className='mt-1 h-1 w-12 rounded-full bg-primary' aria-hidden='true' />
            <p className='mt-6 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground'>
              {about.paragraph1}
            </p>
            <p className='mt-4 max-w-2xl font-sans text-base leading-relaxed text-muted-foreground'>
              {about.paragraph2}
            </p>
            <Link
              href={about.readMoreHref}
              className='group mt-6 inline-flex items-center gap-2 font-sans text-sm font-semibold text-primary hover:underline'
            >
              {about.readMoreLabel}
              <svg
                className='size-4 transition-transform group-hover:translate-x-0.5'
                viewBox='0 0 16 16'
                fill='none'
                aria-hidden='true'
              >
                <path d='M3 8h10M9 4l4 4-4 4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            </Link>
          </div>

          {/* Right: Mini Strategi card */}
          <div className='flex flex-col gap-4'>
            <div className='rounded-2xl bg-primary p-6 text-primary-foreground'>
              <div className='mb-4 flex size-10 items-center justify-center rounded-xl bg-primary-foreground/15'>
                <svg className='size-5' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                  <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='2' />
                  <circle cx='12' cy='12' r='8' stroke='currentColor' strokeWidth='1.5' strokeDasharray='3 2' />
                  <path d='M12 4v2M12 18v2M4 12h2M18 12h2' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
                </svg>
              </div>
              <h3 className='font-heading text-lg font-bold'>{about.miniStrategiTitle}</h3>
              <p className='mt-2 font-sans text-sm leading-relaxed text-primary-foreground/80'>
                {about.miniStrategiDescription}
              </p>
              <Link
                href={about.miniStrategiLinkHref}
                className='mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-primary-foreground/90 hover:text-primary-foreground'
              >
                {about.miniStrategiLinkLabel}
                <svg className='size-4' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
                  <path d='M3 8h10M9 4l4 4-4 4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
