import Image from 'next/image'
import { getLeadershipSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'
import type { LeaderBlock } from '~/db/query/site-settings'

const Monogram = ({ name }: { name: string }) => {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  return (
    <div className='bg-muted text-muted-foreground flex h-full w-full items-center justify-center text-lg font-semibold'>
      {initials || '?'}
    </div>
  )
}

const MemberCard = async ({
  name,
  role,
  photoUrl
}: {
  name: string
  role: string
  photoUrl: string
}) => {
  const photoSrc = await resolveSiteImage(photoUrl)

  return (
    <div className='group flex flex-col'>
      {/* Photo frame — top padding shows bg-muted as a subtle top border */}
      <div className='bg-muted relative aspect-[3/4] w-full overflow-hidden rounded-xl pt-2'>
        {photoSrc ? (
          <div className='absolute inset-0 top-2'>
            <Image
              src={photoSrc}
              alt={`Foto ${name}`}
              fill
              className='object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]'
              unoptimized={photoSrc.startsWith('http')}
            />
          </div>
        ) : (
          <Monogram name={name} />
        )}
      </div>

      {/* Info */}
      <div className='mt-3 space-y-0.5 px-0.5'>
        <p
          className='text-primary line-clamp-1 font-sans text-[9px] font-semibold tracking-[0.18em] uppercase sm:text-[10px] lg:text-xs'
          title={role}
        >
          {role}
        </p>
        <p
          className='text-foreground line-clamp-2 text-sm leading-snug font-semibold lg:text-base'
          title={name}
        >
          {name}
        </p>
      </div>
    </div>
  )
}

const BlockSection = async ({ block }: { block: LeaderBlock }) => {
  if (!block.members.length) return null

  return (
    <div className='space-y-8'>
      {block.title && (
        <div className='flex flex-col items-center gap-3'>
          <h3 className='font-heading text-foreground text-center text-xl font-bold tracking-tight'>
            {block.title}
          </h3>
          <div className='bg-primary/40 h-px w-10 rounded-full' />
        </div>
      )}
      <div className='flex flex-wrap justify-center gap-x-4 gap-y-8'>
        {block.members.map((member) => (
          <div
            key={member.id}
            className='w-[calc(50%-8px)] min-w-0 sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]'
          >
            <MemberCard
              name={member.name}
              role={member.role}
              photoUrl={member.photoUrl}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export const LeadersDirectory = async () => {
  const { leaderBlocks, leaders } = await getLeadershipSettings()

  // Prefer leaderBlocks; fall back to flat leaders for backward compat
  const hasBlocks = leaderBlocks.length > 0
  const hasFlatLeaders = !hasBlocks && leaders.length > 0

  if (!hasBlocks && !hasFlatLeaders) return null

  return (
    <section
      id='jajaran-pengurus'
      aria-label='Jajaran Pengurus'
      className='bg-background border-border border-t px-6 pt-20 pb-16 lg:px-8 lg:pt-28 lg:pb-20'
    >
      <div className='mx-auto max-w-6xl'>
        {hasBlocks ? (
          <div className='space-y-14'>
            {leaderBlocks.map((block) => (
              <BlockSection key={block.id} block={block} />
            ))}
          </div>
        ) : (
          /* Legacy flat leaders fallback */
          <div className='flex flex-wrap justify-center gap-x-4 gap-y-8'>
            {leaders.map((leader, i) => (
              <div
                key={i}
                className='w-[calc(50%-8px)] min-w-0 sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-12px)]'
              >
                <MemberCard
                  name={leader.name}
                  role={leader.role}
                  photoUrl={leader.photoUrl}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
