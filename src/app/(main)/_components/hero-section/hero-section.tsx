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
    <section className='relative bg-background pt-10 pb-12 lg:pt-20 lg:pb-0' aria-labelledby='hero-heading'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='grid grid-cols-1 items-end gap-8 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px]'>

          {/* Left: Copy */}
          <div className='pb-0 lg:pb-24'>
            <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5'>
              <span className='size-1.5 rounded-full bg-primary' aria-hidden='true' />
              <span className='font-sans text-xs font-semibold tracking-widest text-primary uppercase'>
                {hero.badgeText}
              </span>
            </div>

            <h1
              id='hero-heading'
              className='font-heading text-[clamp(2.6rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-foreground'
            >
              {hero.title}{' '}
              <em className='not-italic text-primary'>{hero.titleAccent}</em>
              <br />
              Indonesia
            </h1>

            <p className='mt-6 max-w-xl font-sans text-base leading-relaxed text-muted-foreground md:text-lg'>
              {hero.subtitle}
            </p>

            <div className='mt-8 flex flex-wrap gap-3'>
              <Link href={hero.cta1Href} className={cn(buttonVariants({ size: 'lg' }))}>
                {hero.cta1Label}
              </Link>
              <Link href={hero.cta2Href} className={cn(buttonVariants({ size: 'lg', variant: 'outline' }))}>
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
              <div className='absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent' aria-hidden='true' />
            </div>

            {/* Floating quote card */}
            <div className='absolute -bottom-6 left-4 max-w-[240px] rounded-2xl bg-primary px-5 py-4 shadow-xl lg:-left-12'>
              <svg
                className='mb-2 size-5 text-primary-foreground/60'
                fill='currentColor'
                viewBox='0 0 24 24'
                aria-hidden='true'
              >
                <path d='M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z' />
              </svg>
              <p className='font-heading text-sm font-bold leading-snug text-primary-foreground'>
                &ldquo;{hero.quoteText}&rdquo;
              </p>
              <p className='mt-2 font-sans text-xs text-primary-foreground/70'>
                {hero.quoteAttribution}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle background accent */}
      <div
        className='pointer-events-none absolute top-0 right-0 -z-10 h-[600px] w-[600px] translate-x-1/3 -translate-y-1/4 rounded-full bg-primary/5 blur-3xl'
        aria-hidden='true'
      />
    </section>
  )
}
