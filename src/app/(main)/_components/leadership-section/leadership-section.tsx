import Link from 'next/link'
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

interface LeadershipSectionProps {
  showMoreLink?: boolean
}

export const LeadershipSection = async ({
  showMoreLink = false
}: LeadershipSectionProps) => {
  const { periodLabel, heading, triumvirate } = await getLeadershipSettings()

  const hasContent = [
    triumvirate.ketua,
    triumvirate.sekretaris,
    triumvirate.bendahara
  ].some((p) => p.name || p.photoUrl)
  if (!hasContent) return null

  const [sekretarisSrc, ketuaSrc, bendaharaSrc] = await Promise.all([
    resolveSiteImage(triumvirate.sekretaris.photoUrl),
    resolveSiteImage(triumvirate.ketua.photoUrl),
    resolveSiteImage(triumvirate.bendahara.photoUrl)
  ])

  // Desktop visual order: sekretaris (left) | ketua (center) | bendahara (right)
  // Mobile order via CSS: ketua first, then sekretaris, then bendahara
  const trio: TrioMember[] = [
    {
      key: 'sekretaris',
      label: 'Sekretaris Jenderal',
      ...triumvirate.sekretaris,
      photoSrc: sekretarisSrc,
      position: 'left'
    },
    {
      key: 'ketua',
      label: 'Ketua Umum',
      ...triumvirate.ketua,
      photoSrc: ketuaSrc,
      position: 'center'
    },
    {
      key: 'bendahara',
      label: 'Bendahara Umum',
      ...triumvirate.bendahara,
      photoSrc: bendaharaSrc,
      position: 'right'
    }
  ]

  return (
    <section
      className='bg-background border-border relative flex flex-col overflow-hidden border-b'
      aria-labelledby='leadership-heading'
    >
      {/* Header */}
      <div className='px-6 pt-14 pb-4 text-center sm:pt-16 lg:px-8 lg:pt-20'>
        <p className='text-primary font-sans text-xs font-semibold tracking-widest uppercase'>
          {periodLabel}
        </p>
        <h2
          id='leadership-heading'
          className='font-heading text-foreground mt-2 text-[clamp(1.5rem,3vw,2.25rem)] font-bold'
        >
          {heading}
        </h2>

        {showMoreLink && (
          <div className='mt-6 mb-12 flex justify-center'>
            <Link
              href='/tentang/pengurus'
              className='text-primary hover:text-primary/80 group flex items-center gap-2 font-sans text-sm font-semibold transition-colors'
            >
              Lihat Seluruh Pengurus Pusat
              <svg
                className='size-4 transition-transform group-hover:translate-x-1'
                viewBox='0 0 16 16'
                fill='none'
                aria-hidden='true'
              >
                <path
                  d='M6 12l4-4-4-4'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Photo + name trio */}
      {/* Mobile: stack without heavy card background to avoid AI-slop look, slight scale-down */}
      {/* Desktop (md+): horizontal trio with overlapping negative margins, flush to bottom */}
      <div className='mt-auto flex flex-col items-start gap-10 px-6 sm:px-8 md:flex-row md:items-end md:justify-center md:gap-0 lg:px-12'>
        {trio.map((member) => {
          const isCenter = member.position === 'center'
          const isLeft = member.position === 'left'

          const overlapClass = isLeft
            ? 'md:-mr-[12vw] lg:-mr-[15vw]'
            : !isCenter
              ? 'md:-ml-[12vw] lg:-ml-[15vw]'
              : ''

          const orderClass = isCenter
            ? 'order-1 md:order-none'
            : isLeft
              ? 'order-2 md:order-none'
              : 'order-3 md:order-none'

          const zClass = isCenter ? 'z-10' : 'z-0'

          const heightClass = isCenter
            ? 'h-[clamp(240px,45vh,380px)] md:h-[min(52vw,950px)]'
            : 'h-[clamp(210px,40vh,340px)] md:h-[min(48vw,880px)]'

          return (
            <div
              key={member.key}
              className={cn(
                // Mobile: card with background hugging the content, rounded, restricted height, flush bottom
                // overflow-visible so the name plate can pop out
                'bg-muted/60 scroll-reveal relative shrink-0 overflow-visible rounded-[2.5rem] px-4 pt-4 pb-0',
                // Desktop: transparent, auto width, no rounding, overlapping, no padding
                'md:w-auto md:rounded-none md:bg-transparent md:p-0',
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
                  width={800}
                  height={1067}
                  className='h-full w-auto max-w-none object-contain object-bottom max-md:rounded-t-[2rem] max-md:object-left-bottom'
                  unoptimized={member.photoSrc.startsWith('http')}
                />
              ) : (
                <div
                  className='bg-muted/30 h-full rounded-t-[2rem]'
                  style={{ aspectRatio: '3/4' }}
                />
              )}

              {/* Floating frosted name plate - Popping out to the right on mobile, flush with viewport padding */}
              <div
                className={cn(
                  'absolute rounded-xl bg-white/80 px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-white/50 backdrop-blur-md',
                  // Desktop default: bottom placement
                  'bottom-12 w-max max-w-[85%] max-md:hidden',
                  // Desktop alignment based on position with a bit of offset (8)
                  isCenter
                    ? 'left-1/2 -translate-x-1/2 text-center'
                    : isLeft
                      ? 'left-8 text-left'
                      : 'right-8 text-right',
                  // Mobile override: flush right, popping out to align with viewport edge, text right
                  'max-md:right-[-24px] max-md:bottom-6 max-md:left-auto max-md:flex max-md:max-w-[80%] max-md:translate-x-0 max-md:flex-col max-md:text-right'
                )}
              >
                <p className='text-primary font-sans text-[10px] leading-none font-bold tracking-[0.2em] uppercase'>
                  {member.label}
                </p>
                <p className='font-heading text-foreground mt-1.5 text-sm leading-tight font-bold md:text-base'>
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
