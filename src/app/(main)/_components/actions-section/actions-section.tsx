import Image from 'next/image'
import { getActionsSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'

export const ActionsSection = async () => {
  const { heading, subheading, programs } = await getActionsSettings()

  const resolvedPrograms = await Promise.all(
    programs.map(async (p) => ({
      ...p,
      imageSrc: await resolveSiteImage(p.imageUrl)
    }))
  )

  const featured = resolvedPrograms.find((p) => p.featured)
  const regular = resolvedPrograms.filter((p) => !p.featured)

  return (
    <section
      className='bg-foreground py-20 lg:py-28'
      aria-labelledby='actions-heading'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-12 text-center'>
          <h2
            id='actions-heading'
            className='font-heading text-[clamp(1.8rem,3.5vw,2.5rem)] font-bold text-background'
          >
            {heading}
          </h2>
          <p className='mt-3 font-sans text-sm text-background/60'>
            {subheading}
          </p>
        </div>

        <div className='grid grid-cols-2 gap-4 lg:grid-cols-[2fr_1fr_1fr]'>
          {/* Featured card */}
          {featured && (
            <article className='group relative col-span-2 overflow-hidden rounded-2xl lg:col-span-1 lg:row-span-2'>
              {featured.imageSrc && (
                <Image
                  src={featured.imageSrc}
                  alt={`Dokumentasi ${featured.label}`}
                  width={600}
                  height={700}
                  className='h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:h-full'
                  unoptimized={featured.imageSrc.includes('?')}
                />
              )}
              <div className='absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent' aria-hidden='true' />
              <div className='absolute inset-x-0 bottom-0 p-5'>
                <span className='inline-block rounded-full bg-primary px-3 py-1 font-sans text-xs font-bold text-primary-foreground'>
                  {featured.label}
                </span>
                <p className='mt-2 font-heading text-base font-bold leading-snug text-background'>
                  {featured.sublabel}
                </p>
                <p className='mt-1 font-sans text-xs text-background/70'>{featured.description}</p>
              </div>
            </article>
          )}

          {/* Regular cards */}
          {regular.map((program) => (
            <article
              key={program.id}
              className='group relative overflow-hidden rounded-2xl'
            >
              {program.imageSrc && (
                <Image
                  src={program.imageSrc}
                  alt={`Dokumentasi ${program.label}`}
                  width={400}
                  height={280}
                  className='h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105 lg:h-44'
                  unoptimized={program.imageSrc.includes('?')}
                />
              )}
              <div className='absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/10 to-transparent' aria-hidden='true' />
              <div className='absolute inset-x-0 bottom-0 p-4'>
                <p className='font-heading text-sm font-bold leading-tight text-background'>
                  {program.sublabel}
                </p>
                <p className='mt-0.5 font-sans text-xs text-background/60'>{program.label}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
