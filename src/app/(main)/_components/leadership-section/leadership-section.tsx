import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from '~/components/shadcn/ui/button/button'
import { cn } from '~/lib/shadcn/utils'
import { getLeadershipSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'

export const LeadershipSection = async () => {
  const { periodLabel, heading, leaders } = await getLeadershipSettings()

  const resolvedLeaders = await Promise.all(
    leaders.map(async (l) => ({
      ...l,
      photoSrc: await resolveSiteImage(l.photoUrl)
    }))
  )

  return (
    <section
      className='bg-background py-20 lg:py-28'
      aria-labelledby='leadership-heading'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-3 text-center'>
          <p className='font-sans text-xs font-semibold tracking-widest text-primary uppercase'>
            {periodLabel}
          </p>
          <h2
            id='leadership-heading'
            className='mt-2 font-heading text-[clamp(1.5rem,3vw,2rem)] font-bold text-foreground'
          >
            {heading}
          </h2>
          <div className='mx-auto mt-1 h-1 w-12 rounded-full bg-primary' aria-hidden='true' />
        </div>

        <div className='mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3'>
          {resolvedLeaders.map((leader) => (
            <article
              key={leader.name}
              className='group flex flex-col items-center text-center'
            >
              <div className='relative mb-4 overflow-hidden rounded-2xl'>
                {leader.photoSrc ? (
                  <Image
                    src={leader.photoSrc}
                    alt={`Foto ${leader.name}`}
                    width={360}
                    height={420}
                    className='h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-72'
                    unoptimized={leader.photoSrc.includes('?')}
                  />
                ) : (
                  <div className='h-64 w-full bg-muted sm:h-72' />
                )}
                <div className='absolute inset-0 bg-gradient-to-t from-foreground/15 to-transparent' aria-hidden='true' />
              </div>
              <h3 className='font-heading text-base font-bold text-foreground'>{leader.name}</h3>
              <p className='mt-1 font-sans text-xs font-semibold tracking-wide text-primary uppercase'>
                {leader.role}
              </p>
            </article>
          ))}
        </div>

        <div className='mt-10 flex justify-center'>
          <Link href='/dashboard' className={cn(buttonVariants({ variant: 'outline' }))}>
            Selengkapnya
          </Link>
        </div>
      </div>
    </section>
  )
}
