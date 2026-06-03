import { getLeadershipSettings } from '~/app/(main)/_data/site-settings'
import { resolveSiteImage } from '~/lib/utils/site-image'
import { LeadersDirectoryClient } from './leaders-directory-client'

export const LeadersDirectory = async () => {
  const { leaderBlocks, leaders } = await getLeadershipSettings()

  const hasBlocks = leaderBlocks.length > 0
  const hasFlatLeaders = !hasBlocks && leaders.length > 0

  if (!hasBlocks && !hasFlatLeaders) return null

  if (hasBlocks) {
    const resolvedBlocks = await Promise.all(
      leaderBlocks.map(async (block) => ({
        id: block.id,
        title: block.title,
        members: await Promise.all(
          block.members.map(async (member) => ({
            id: member.id,
            name: member.name,
            role: member.role,
            photoSrc: await resolveSiteImage(member.photoUrl),
          }))
        ),
      }))
    )
    return <LeadersDirectoryClient blocks={resolvedBlocks} />
  }

  // Legacy flat leaders fallback
  const resolvedFlat = await Promise.all(
    leaders.map(async (leader, i) => ({
      id: `flat-${i}`,
      name: leader.name,
      role: leader.role,
      photoSrc: await resolveSiteImage(leader.photoUrl),
    }))
  )

  return (
    <LeadersDirectoryClient
      blocks={[{ id: 'legacy', title: '', members: resolvedFlat }]}
    />
  )
}
