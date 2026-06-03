import { notFound } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { readMemberByRegisterNumber } from '~/db/query/member'
import { readMemberTrainingHistory } from '~/db/query/training'
import { readOrgHierarchyChain } from '~/db/query/organization'
import { readMemberAcademic } from '~/db/query/academic'
import { readMemberCareer } from '~/db/query/career'
import { readMemberOrganizationHistory } from '~/db/query/organization-history'
import { ProfileInlineEditForm } from './_components/profile-inline-edit-form'
import { ProfileOrgHierarchy } from './_components/profile-org-hierarchy'
import { ResetPasswordButton } from './_components/reset-password'

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

  const [
    trainingHistory,
    orgChain,
    academicHistory,
    careerHistory,
    organizationHistory
  ] = await Promise.all([
    readMemberTrainingHistory(member.id),
    member.organization?.id
      ? readOrgHierarchyChain(member.organization.id)
      : Promise.resolve([]),
    readMemberAcademic(member.id),
    readMemberCareer(member.id),
    readMemberOrganizationHistory(member.id)
  ])

  const userCanEdit = canEdit(session, member.id)

  const adminActionsSlot =
    userCanEdit &&
    session?.user.role === 'bpk' &&
    session.user.connectedOrganization ? (
      <ResetPasswordButton
        memberId={member.id}
        organizationId={session.user.connectedOrganization.id}
      />
    ) : null

  return (
    <ProfileInlineEditForm
      member={member}
      canEdit={userCanEdit}
      trainingHistory={trainingHistory}
      academicHistory={academicHistory}
      careerHistory={careerHistory}
      organizationHistory={organizationHistory}
      adminActionsSlot={adminActionsSlot}
      orgHierarchySlot={
        orgChain.length > 0 ? (
          <ProfileOrgHierarchy
            chain={orgChain}
            currentOrgId={member.organization?.id ?? ''}
          />
        ) : null
      }
    />
  )
}

export default ProfilePage
