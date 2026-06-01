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
              className='font-heading text-foreground text-[clamp(1.5rem,3vw,2rem)] font-bold'
            >
              Tentang KAMMI
            </h2>
            <div
              className='bg-primary mt-1 h-1 w-12 rounded-full'
              aria-hidden='true'
            />
            <p className='text-muted-foreground mt-6 max-w-2xl font-sans text-base leading-relaxed'>
              {about.paragraph1}
            </p>
            <p className='text-muted-foreground mt-4 max-w-2xl font-sans text-base leading-relaxed'>
              {about.paragraph2}
            </p>
            <Link
              href={about.readMoreHref}
              className='group text-primary mt-6 inline-flex items-center gap-2 font-sans text-sm font-semibold hover:underline'
            >
              {about.readMoreLabel}
              <svg
                className='size-4 transition-transform group-hover:translate-x-0.5'
                viewBox='0 0 16 16'
                fill='none'
                aria-hidden='true'
              >
                <path
                  d='M3 8h10M9 4l4 4-4 4'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </Link>
          </div>

          {/* Right: Sejarah Singkat card */}
          <div className='flex flex-col gap-4'>
            <div className='bg-primary text-primary-foreground rounded-2xl p-6'>
              {/* Calendar icon */}
              <div className='bg-primary-foreground/15 mb-4 flex size-10 items-center justify-center rounded-xl'>
                <svg
                  className='size-5'
                  viewBox='0 0 24 24'
                  fill='none'
                  aria-hidden='true'
                >
                  <rect
                    x='3'
                    y='4'
                    width='18'
                    height='18'
                    rx='2'
                    stroke='currentColor'
                    strokeWidth='1.5'
                  />
                  <path
                    d='M16 2v4M8 2v4M3 10h18'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                  />
                  <path
                    d='M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                </svg>
              </div>

              {/* Date badge */}
              <p className='text-primary-foreground/60 font-sans text-xs font-semibold tracking-widest uppercase'>
                29 Maret 1998 · Malang
              </p>

              <h3 className='font-heading mt-1 text-lg font-bold'>
                {about.sejarahCardTitle}
              </h3>
              <p className='text-primary-foreground/80 mt-2 font-sans text-sm leading-relaxed'>
                {about.sejarahCardDescription}
              </p>
              <Link
                href={about.sejarahCardLinkHref}
                className='text-primary-foreground/90 hover:text-primary-foreground mt-4 inline-flex items-center gap-1.5 font-sans text-sm font-semibold'
              >
                {about.sejarahCardLinkLabel}
                <svg
                  className='size-4'
                  viewBox='0 0 16 16'
                  fill='none'
                  aria-hidden='true'
                >
                  <path
                    d='M3 8h10M9 4l4 4-4 4'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
