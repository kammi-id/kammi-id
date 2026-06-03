import Image from 'next/image'
import { getHomeHeroItemsSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'
import { HeroSectionClient } from './hero-section-client'

export const HeroSection = async () => {
  const { items } = await getHomeHeroItemsSettings()
  if (!items.length) return null

  const resolved = await Promise.all(
    items.map(async (item) => ({
      ...item,
      resolvedImageUrl: await resolveSiteImage(item.imageUrl)
    }))
  )

  return (
    <HeroSectionClient>
      {resolved.map((item) => (
        <section
          key={item.id}
          data-hero-section
          className='relative h-[100vh] w-full overflow-hidden'
          aria-labelledby={`hero-heading-${item.id}`}
        >
          {/* Image wrapper — GSAP targets this for zoom + fade out */}
          <div data-hero-img className='absolute inset-0'>
            {item.resolvedImageUrl ? (
              <Image
                src={item.resolvedImageUrl}
                alt={item.title}
                fill
                className='object-cover'
                priority
                unoptimized={item.resolvedImageUrl.includes('?')}
              />
            ) : (
              <div className='absolute inset-0 bg-foreground/10' />
            )}
          </div>

          <div
            className='pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent'
            aria-hidden='true'
          />

          <div className='absolute inset-0 flex items-center'>
            <div className='mx-auto w-full max-w-7xl px-6 lg:px-8'>
              {item.badgeText && (
                <div
                  data-hero-badge
                  className='mb-5 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm'
                >
                  <span className='font-sans text-xs font-semibold tracking-widest text-white uppercase'>
                    {item.badgeText}
                  </span>
                </div>
              )}

              <h1
                data-hero-h1
                id={`hero-heading-${item.id}`}
                className='font-heading text-[clamp(2.6rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight text-white'
              >
                {item.title}
              </h1>

              {item.description && (
                <p
                  data-hero-desc
                  className='mt-5 max-w-xl font-sans text-base leading-relaxed text-white/80 md:text-lg'
                >
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </section>
      ))}
    </HeroSectionClient>
  )
}
