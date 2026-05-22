import Image from 'next/image'
import Link from 'next/link'
import { buttonVariants } from '~/components/shadcn/ui/button/button'
import { cn } from '~/lib/shadcn/utils'
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
    <section className='relative bg-background overflow-hidden min-h-screen flex flex-col' aria-labelledby='leadership-heading'>
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
        <div className='mt-6'>
          <Link href='/pengurus' className={cn(buttonVariants({ variant: 'outline' }))}>
            Pengurus Lengkap
          </Link>
        </div>
      </div>

      {/* Spacer — dorong foto ke bawah section */}
      <div className='flex-1' />

      {/* Photo + name trio — items-end aligns photo bottoms */}
      <div className='flex items-end justify-center'>
        {trio.map((leader) => {
          const isChairman = leader === chairman
          const isSecretary = leader === secretary
          const isTreasurer = leader === treasurer

          // Ketum = 65vh section, sekjend 95%, bendum 90% — min 65vh agar tidak terlalu kecil
          const vhFactor = isChairman ? 65 : isSecretary ? 65 * 0.95 : 65 * 0.90
          const minPx    = isChairman ? 220 : isSecretary ? 209 : 198
          const maxPx    = isChairman ? 650 : isSecretary ? 618 : 585

          // Overlap tetap ~20% dari lebar sekitar (estimasi visual)
          const overlapClass = isSecretary
            ? '-mr-[22px] sm:-mr-[36px] lg:-mr-[60px]'
            : isTreasurer
              ? '-ml-[20px] sm:-ml-[34px] lg:-ml-[58px]'
              : ''

          const zClass = isChairman ? 'z-10' : 'z-0'

          return (
            <div
              key={leader.name}
              className={`relative shrink-0 flex flex-col items-center ${overlapClass} ${zClass}`}
            >
              {/* Photo — height-controlled, width auto (rasio asli foto) */}
              <div style={{ height: `clamp(${minPx}px, ${vhFactor}vh, ${maxPx}px)` }}>
                {leader.photoSrc ? (
                  <Image
                    src={leader.photoSrc}
                    alt={`Foto ${leader.name}`}
                    width={400}
                    height={534}
                    className='h-full w-auto max-w-none'
                    style={{ height: '100%', width: 'auto' }}
                    unoptimized={leader.photoSrc.includes('?')}
                  />
                ) : (
                  <div className='h-full w-24 bg-muted' />
                )}
              </div>

              {/* Name plate — below photo, flush to section bottom */}
              <div className='pt-3 pb-0 text-center px-1'>
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
