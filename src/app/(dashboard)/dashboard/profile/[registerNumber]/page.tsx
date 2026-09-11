import { notFound } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { isOrgInScope, fetchAllowedOrgIds } from '~/db/query/organization'
import {
  requireMemberMutationAccess,
  requireMemberReadAccess,
  requireMemberEditAccess
} from '~/lib/auth/kaderisasi'
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

  // Celah 2 (ADR 0027) — gerbang baca. `member` menyelesaikan lebih dulu,
  // supaya "tidak berhak" dan "tidak ada" keduanya berakhir di `notFound()`
  // yang sama — halaman ini tidak boleh jadi alat pemeriksa keberadaan NIA.
  // Digabung lewat gerbang yang sama dengan jalur sunting di bawah
  // (`requireMemberEditAccess`), supaya "boleh baca" tidak pernah dihitung
  // ulang secara terpisah di sini.
  const canRead = await requireMemberReadAccess(
    member.id,
    member.organizationId
  )
  if (!canRead) notFound()

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

  // Celah 3 — jalur sunting dikomposisikan lewat gerbang yang sama dengan
  // jalur baca di atas, supaya keduanya tidak bisa berpisah: BPK hanya lolos
  // di dalam Cakupannya.
  const userCanEdit = await requireMemberEditAccess(
    member.id,
    member.organizationId
  )
  // Celah 1, akibat di UI — kontrol Jenjang Kaderisasi/Keadaan
  // Kader/sertifikasi Perangkat di `profile-sidebar` hanya tampil bagi
  // Root/BPK; seorang `member` yang mengedit dirinya sendiri tidak pernah
  // melihatnya. Penegakan sesungguhnya ada di skema Server Action, ini
  // semata konsekuensinya.
  const canEditManaged = userCanEdit && session?.user.role !== 'member'

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
      canEditManaged={canEditManaged}
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
