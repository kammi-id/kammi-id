import { notFound } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { isOrgInScope, fetchAllowedOrgIds } from '~/db/query/organization'
import { requireMemberMutationAccess } from '~/lib/auth/kekaderan'
import {
  getCachedMemberByRegisterNumber,
  getCachedMemberTrainingHistory,
  getCachedMemberAcademic,
  getCachedMemberCareer,
  getCachedMemberOrganizationHistory
} from '../../_data/members'
import {
  getCachedOrgHierarchyChain,
  getCachedOrganizations
} from '../../_data/organizations'
import { ProfileInlineEditForm } from './_components/profile-inline-edit-form'
import { ProfileOrgHierarchy } from './_components/profile-org-hierarchy'
import { ResetPasswordButton } from './_components/reset-password'
import { DeleteMemberButton } from './_components/delete-member-button'
import { MutateMemberButton } from './_components/mutate-member-button'

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
    getCachedMemberByRegisterNumber(decodeURIComponent(registerNumber))
  ])

  if (!member) notFound()

  const [
    trainingHistory,
    orgChain,
    academicHistory,
    careerHistory,
    organizationHistory
  ] = await Promise.all([
    getCachedMemberTrainingHistory(member.id),
    member.organization?.id
      ? getCachedOrgHierarchyChain(member.organization.id)
      : Promise.resolve([]),
    getCachedMemberAcademic(member.id),
    getCachedMemberCareer(member.id),
    getCachedMemberOrganizationHistory(member.id)
  ])

  const userCanEdit = canEdit(session, member.id)

  const resetPasswordSlot =
    userCanEdit &&
    session?.user.role === 'bpk' &&
    session.user.connectedOrganization ? (
      <ResetPasswordButton
        memberId={member.id}
        organizationId={session.user.connectedOrganization.id}
      />
    ) : null

  const canMutate = session ? !(await requireMemberMutationAccess()) : false

  let mutationSlot = null
  if (canMutate && session && member.organization) {
    const allowedOrgIds = await fetchAllowedOrgIds(session.user)
    const destinationOrgs = await getCachedOrganizations({
      id: allowedOrgIds,
      type: ['pd', 'pdln', 'pk']
    })

    mutationSlot = (
      <MutateMemberButton
        memberId={member.id}
        name={member.name}
        currentOrganizationId={member.organization.id}
        currentOrganizationName={member.organization.name}
        organizations={destinationOrgs.map((org) => ({
          id: org.id,
          name: org.name
        }))}
      />
    )
  }

  const adminActionsSlot =
    resetPasswordSlot || mutationSlot ? (
      <>
        {mutationSlot}
        {resetPasswordSlot}
      </>
    ) : null

  let canDelete = false
  if (session?.user.role === 'root') {
    canDelete = true
  } else if (session?.user.role === 'bpk' && member.organization?.id) {
    canDelete = await isOrgInScope(session.user, member.organization.id)
  }

  const dangerZoneSlot = canDelete ? (
    <DeleteMemberButton
      memberId={member.id}
      registerNumber={member.registerNumber}
      name={member.name}
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
      dangerZoneSlot={dangerZoneSlot}
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
