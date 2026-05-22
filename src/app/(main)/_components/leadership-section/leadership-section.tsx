import Image from 'next/image'
import { getLeadershipSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'

type Leader = { name: string; role: string; photoUrl: string; photoSrc: string | null }

const findByRole = (leaders: Leader[], keyword: string, fallback: Leader | undefined) =>
  leaders.find((l) => l.role.toLowerCase().includes(keyword.toLowerCase())) ?? fallback

export const LeadershipSection = async () => {
  const { periodLabel, heading, leaders } = await getLeadershipSettings()

  if (!leaders.length) return null

  const resolved: Leader[] = await Promise.all(
    leaders.slice(0, 5).map(async (l) => ({
      ...l,
      photoSrc: await resolveSiteImage(l.photoUrl)
    }))
  )

  const chairman = findByRole(resolved, 'ketua umum', resolved[0])
  const secretary = findByRole(
    resolved.filter((l) => l !== chairman),
    'sekretaris',
    resolved[1]
  )
  const treasurer = findByRole(
    resolved.filter((l) => l !== chairman && l !== secretary),
    'bendahara',
    resolved[2]
  )

  const trio = [secretary, chairman, treasurer].filter(Boolean) as Leader[]

  return (
    <section className='relative bg-background overflow-hidden' aria-labelledby='leadership-heading'>
      {/* Header */}
      <div className='pt-14 sm:pt-16 lg:pt-20 pb-8 text-center px-6 lg:px-8'>
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

      {/* Photo + name trio — items-end aligns photo bottoms */}
      <div className='flex items-end justify-center'>
        {trio.map((leader) => {
          const isChairman = leader === chairman
          const isSecretary = leader === secretary
          const isTreasurer = leader === treasurer

          // Sekretaris 85%, Bendahara 80%, Ketua 100%
          const factor = isChairman ? 1 : isSecretary ? 0.85 : 0.8

          const wBase = Math.round(120 * factor)
          const wSm   = Math.round(200 * factor)
          const wLg   = Math.round(340 * factor)

          // ~20% overlap of each flanker's own width
          const overlapClass = isSecretary
            ? '-mr-[20px] sm:-mr-[34px] lg:-mr-[58px]'
            : isTreasurer
              ? '-ml-[19px] sm:-ml-[32px] lg:-ml-[54px]'
              : ''

          const zClass = isChairman ? 'z-10' : 'z-0'

          return (
            <div
              key={leader.name}
              className={`relative shrink-0 flex flex-col items-center ${overlapClass} ${zClass}`}
            >
              {/* Photo — full image, no crop, no frame, no gradient */}
              <div style={{ width: `clamp(${wBase}px, ${(wSm / 640) * 100}vw, ${wLg}px)` }}>
                {leader.photoSrc ? (
                  <Image
                    src={leader.photoSrc}
                    alt={`Foto ${leader.name}`}
                    width={wLg}
                    height={Math.round(wLg * 4 / 3)}
                    className='w-full'
                    style={{ height: 'auto' }}
                    unoptimized={leader.photoSrc.includes('?')}
                  />
                ) : (
                  <div className='w-full bg-muted' style={{ aspectRatio: '3/4' }} />
                )}
              </div>

              {/* Name plate — below photo */}
              <div className='pt-3 pb-5 text-center px-1'>
                <p className='font-sans text-[9px] font-semibold tracking-[0.18em] text-primary uppercase leading-none'>
                  {leader.role}
                </p>
                <p className='font-heading text-sm font-bold text-foreground leading-tight mt-1'>
                  {leader.name}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
