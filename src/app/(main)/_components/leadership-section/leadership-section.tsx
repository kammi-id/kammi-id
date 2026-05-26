import Image from 'next/image'
import { cn } from '~/lib/shadcn/utils'
import { getLeadershipSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'

type TrioMember = {
  key: string
  label: string
  name: string
  photoSrc: string | null
  position: 'left' | 'center' | 'right'
}

export const LeadershipSection = async () => {
  const { periodLabel, heading, triumvirate } = await getLeadershipSettings()

  const hasContent = [triumvirate.ketua, triumvirate.sekretaris, triumvirate.bendahara]
    .some((p) => p.name || p.photoUrl)
  if (!hasContent) return null

  const [sekretarisSrc, ketuaSrc, bendaharaSrc] = await Promise.all([
    resolveSiteImage(triumvirate.sekretaris.photoUrl),
    resolveSiteImage(triumvirate.ketua.photoUrl),
    resolveSiteImage(triumvirate.bendahara.photoUrl),
  ])

  // Desktop visual order: sekretaris (left) | ketua (center) | bendahara (right)
  // Mobile order via CSS: ketua first, then sekretaris, then bendahara
  const trio: TrioMember[] = [
    { key: 'sekretaris', label: 'Sekretaris Jenderal', ...triumvirate.sekretaris, photoSrc: sekretarisSrc, position: 'left' },
    { key: 'ketua', label: 'Ketua Umum', ...triumvirate.ketua, photoSrc: ketuaSrc, position: 'center' },
    { key: 'bendahara', label: 'Bendahara Umum', ...triumvirate.bendahara, photoSrc: bendaharaSrc, position: 'right' },
  ]

  return (
    <section
      className='bg-background relative flex min-h-screen flex-col overflow-hidden'
      aria-labelledby='leadership-heading'
    >
      {/* Header */}
      <div className='px-6 pt-14 pb-8 text-center sm:pt-16 lg:px-8 lg:pt-20'>
        <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
          {periodLabel}
        </p>
        <h2
          id='leadership-heading'
          className='font-heading text-foreground mt-2 text-[clamp(1.5rem,3vw,2rem)] font-bold'
        >
          {heading}
        </h2>
      </div>

      {/* Spacer */}
      <div className='flex-1' />

      {/* Photo + name trio */}
      {/* Mobile: single-column vertical stack, ketua on top via CSS order, each card has background */}
      {/* Desktop (md+): horizontal trio with overlapping negative margins, transparent photos */}
      <div className='flex flex-col items-center gap-3 px-4 pb-8 sm:px-6 md:flex-row md:items-end md:justify-center md:gap-0 md:px-0 md:pb-0'>
        {trio.map((member) => {
          const isCenter = member.position === 'center'
          const isLeft = member.position === 'left'

          // Desktop overlap margins (only applied at md+)
          const overlapClass = isLeft
            ? 'md:-mr-[45px] lg:-mr-[90px]'
            : !isCenter
              ? 'md:-ml-[45px] lg:-ml-[90px]'
              : ''

          // Mobile: ketua first (order-1), then sekretaris (order-2), bendahara (order-3)
          const orderClass = isCenter
            ? 'order-1 md:order-none'
            : isLeft
              ? 'order-2 md:order-none'
              : 'order-3 md:order-none'

          const zClass = isCenter ? 'z-10' : 'z-0'

          // Heights: mobile shorter (card view), desktop taller (floating photo)
          const heightClass = isCenter
            ? 'h-[clamp(220px,48vh,400px)] md:h-[clamp(220px,65vh,650px)]'
            : 'h-[clamp(200px,43vh,360px)] md:h-[clamp(209px,61.75vh,618px)]'

          return (
            <div
              key={member.key}
              className={cn(
                // Mobile: full-width card with background, rounded, clipped, top padding for framing
                'relative shrink-0 w-full overflow-hidden rounded-2xl bg-muted pt-3',
                // Desktop: revert to auto-width transparent float, no padding
                'md:w-auto md:overflow-visible md:rounded-none md:bg-transparent md:pt-0',
                overlapClass,
                orderClass,
                zClass,
                heightClass
              )}
            >
              {member.photoSrc ? (
                <Image
                  src={member.photoSrc}
                  alt={`Foto ${member.name}`}
                  width={400}
                  height={534}
                  className='h-full w-auto max-w-none'
                  unoptimized={member.photoSrc.startsWith('http')}
                />
              ) : (
                <div className='bg-muted/50 h-full' style={{ aspectRatio: '3/4' }} />
              )}

              {/* Floating frosted name plate */}
              {/* Desktop default: centered; Mobile override: right-aligned (photo flush left) */}
              <div className={cn(
                'absolute bottom-4 rounded-xl bg-white/90 px-3 py-2 shadow-[0_4px_28px_rgba(0,0,0,0.18)] backdrop-blur-md ring-1 ring-white/60',
                // Desktop default: centered
                'left-1/2 -translate-x-1/2 w-max max-w-[85%] text-center',
                // Mobile override: flush right, text right, narrower
                'max-md:left-auto max-md:translate-x-0 max-md:right-4 max-md:text-right max-md:max-w-[52%]'
              )}>
                <p className='text-primary font-sans text-[9px] leading-none font-semibold tracking-[0.18em] uppercase'>
                  {member.label}
                </p>
                <p className='font-heading text-foreground mt-1 text-sm leading-tight font-bold'>
                  {member.name}
                </p>
              </div>
            </div>
          )
        })}
      </div>

    </section>
  )
}
