import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from '~/components/shadcn/ui/button/button'
import { cn } from '~/lib/shadcn/utils'
import { getHeroSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'

export const HeroSection = async () => {
  const hero = await getHeroSettings()
  const heroImageSrc = await resolveSiteImage(hero.heroImageUrl)

  return (
    <section
      className='bg-background relative pt-10 pb-12 lg:pt-20 lg:pb-0'
      aria-labelledby='hero-heading'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px]'>
          {/* Left: Copy */}
          <div className='pb-0 lg:pb-24'>
            <div className='border-primary/20 bg-primary/5 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5'>
              <span
                className='bg-primary size-1.5 rounded-full'
                aria-hidden='true'
              />
              <span className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
                {hero.badgeText}
              </span>
            </div>

            <h1
              id='hero-heading'
              className='font-heading text-foreground text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.05] font-bold tracking-tight'
            >
              {hero.title}{' '}
              <em className='text-primary not-italic'>{hero.titleAccent}</em>
              <br />
              Indonesia
            </h1>

            <p className='text-muted-foreground mt-6 max-w-xl font-sans text-base leading-relaxed md:text-lg'>
              {hero.subtitle}
            </p>

            <div className='mt-8 flex flex-wrap gap-3'>
              <Link
                href={hero.cta1Href}
                className={cn(buttonVariants({ size: 'lg' }))}
              >
                {hero.cta1Label}
              </Link>
              <Link
                href={hero.cta2Href}
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'outline' })
                )}
              >
                {hero.cta2Label}
              </Link>
            </div>
          </div>

          {/* Right: Photo + floating quote */}
          <div className='relative lg:block'>
            <div className='relative overflow-hidden rounded-tl-3xl rounded-tr-3xl'>
              {heroImageSrc && (
                <Image
                  src={heroImageSrc}
                  alt={hero.heroImageAlt}
                  width={480}
                  height={580}
                  className='h-auto w-full object-cover'
                  priority
                  unoptimized={heroImageSrc.includes('?')}
                />
              )}
              <div
                className='from-foreground/20 absolute inset-0 bg-gradient-to-t to-transparent'
                aria-hidden='true'
              />
            </div>

            {/* Floating quote card */}
            <div className='bg-primary absolute -bottom-6 left-4 max-w-[240px] rounded-2xl px-5 py-4 shadow-xl lg:-left-12'>
              <svg
                className='text-primary-foreground/60 mb-2 size-5'
                fill='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path d='M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z' />
              </svg>
              <p className='font-heading text-primary-foreground text-sm leading-snug font-bold'>
                &ldquo;{hero.quoteText}&rdquo;
              </p>
              <p className='text-primary-foreground/70 mt-2 font-sans text-xs'>
                {hero.quoteAttribution}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle background accent */}
      <div
        className='bg-primary/5 pointer-events-none absolute top-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full blur-3xl'
        aria-hidden='true'
      />
    </section>
  )
}
