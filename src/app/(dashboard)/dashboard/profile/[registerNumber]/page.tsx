import { notFound } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { readMemberByRegisterNumber } from '~/db/query/member'
import { readMemberTrainingHistory } from '~/db/query/training'
import { readOrgHierarchyChain } from '~/db/query/organization'
import { ProfileInlineEditForm } from './_components/profile-inline-edit-form'
import { ProfileOrgHierarchy } from './_components/profile-org-hierarchy'

const canEdit = (
  session: Awaited<ReturnType<typeof readActiveSession>>,
  memberId: string
): boolean => {
  if (!session) return false
  const { role, connectedMember } = session.user
  if (role === 'root' || role === 'bpk') return true
  if (
    role === 'member' &&
    (connectedMember as { id: string } | null)?.id === memberId
  )
    return true
  return false
}

const ProfilePage = async ({
  params
}: {
  params: Promise<{ registerNumber: string }>
}) => {
  const { registerNumber } = await params

  const [session, member] = await Promise.all([
    readActiveSession(),
    readMemberByRegisterNumber(decodeURIComponent(registerNumber))
  ])

  if (!member) notFound()

  const [trainingHistory, orgChain] = await Promise.all([
    readMemberTrainingHistory(member.id),
    member.organization?.id
      ? readOrgHierarchyChain(member.organization.id)
      : Promise.resolve([])
  ])

  const userCanEdit = canEdit(session, member.id)

  return (
    <div className='flex flex-col'>
      <ProfileInlineEditForm
        member={member}
        canEdit={userCanEdit}
        trainingHistory={trainingHistory}
        orgHierarchySlot={
          orgChain.length > 0 ? (
            <ProfileOrgHierarchy
              chain={orgChain}
              currentOrgId={member.organization?.id ?? ''}
            />
          ) : null
        }
      />
    </div>
  )
}

export default ProfilePage
