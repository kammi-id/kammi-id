import Image from 'next/image'
import { getLeadershipSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'

type Leader = { name: string; role: string; photoUrl: string; photoSrc: string | null }

const findByRole = (leaders: Leader[], keyword: string, fallback: Leader | undefined) =>
  leaders.find((l) => l.role.toLowerCase().includes(keyword.toLowerCase())) ?? fallback

const Nameplate = ({ name, role }: { name: string; role: string }) => (
  <div className='absolute top-4 left-4 right-4 z-20 bg-background/92 px-3 py-2.5'>
    <p className='font-sans text-[9px] font-semibold tracking-[0.18em] text-primary uppercase leading-none'>
      {role}
    </p>
    <p className='font-heading text-sm font-bold text-foreground leading-tight mt-1'>
      {name}
    </p>
  </div>
)

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
    <section
      className='relative bg-background overflow-hidden min-h-[300px] sm:min-h-[460px] lg:min-h-[640px]'
      aria-labelledby='leadership-heading'
    >
      {/* Section header */}
      <div className='pt-14 sm:pt-16 lg:pt-20 pb-4 text-center px-6 lg:px-8 relative z-10'>
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

      {/* Photo composition — flush to section bottom */}
      <div className='absolute bottom-0 inset-x-0 flex items-end justify-center'>
        {trio.map((leader, i) => {
          const isChairman = leader === chairman
          const isLeft = leader === secretary

          // Secretary (left) and treasurer (right) are 90% the chairman's size
          const wBase = isChairman ? 120 : 108
          const hBase = isChairman ? 160 : 144
          const wSm = isChairman ? 200 : 180
          const hSm = isChairman ? 267 : 240
          const wLg = isChairman ? 380 : 342
          const hLg = isChairman ? 507 : 456

          // ~20% overlap: 22px base / 36px sm / 68px lg
          const overlapClass = isLeft
            ? '-mr-[22px] sm:-mr-[36px] lg:-mr-[68px]'
            : isChairman
              ? ''
              : '-ml-[22px] sm:-ml-[36px] lg:-ml-[68px]'

          const zClass = isChairman ? 'z-10' : 'z-0'

          return (
            <div
              key={leader.name}
              className={`relative shrink-0 ${overlapClass} ${zClass}`}
            >
              {/* Photo frame — no border-radius per spec */}
              <div
                className='relative overflow-hidden'
                style={{
                  width: `clamp(${wBase}px, ${(wSm / 640) * 100}vw, ${wLg}px)`,
                  height: `clamp(${hBase}px, ${(hSm / 640) * 100}vw, ${hLg}px)`
                }}
              >
                {/* Nameplate — 1rem from top border of photo */}
                <Nameplate name={leader.name} role={leader.role} />

                {/* Photo */}
                {leader.photoSrc ? (
                  <Image
                    src={leader.photoSrc}
                    alt={`Foto ${leader.name}`}
                    width={wLg}
                    height={hLg}
                    className='h-full w-full object-cover object-top'
                    unoptimized={leader.photoSrc.includes('?')}
                  />
                ) : (
                  <div className='h-full w-full bg-muted' />
                )}

                {/* Very subtle bottom vignette for visual grounding */}
                <div
                  className='absolute inset-0 bg-gradient-to-t from-foreground/8 via-transparent to-transparent pointer-events-none'
                  aria-hidden='true'
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
