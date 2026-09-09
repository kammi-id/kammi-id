import { notFound } from 'next/navigation'
import { TrainingDetailView } from '~/app/(dashboard)/dashboard/trainings/_components/training-detail-view'
import { isOrgInScope } from '~/db/query/organization'
import { readActiveSession } from '~/lib/auth/cookies'
import { masaPenetapanKelulusan } from '~/lib/daurah/masa-penetapan-kelulusan'
import { getCachedOrganization } from '../../../_data/organizations'
import { getCachedTrainingByIdentifier } from '../../../_data/trainings'

interface PageProps {
  params: Promise<{
    branch: string
    id: string
  }>
}

const TrainingPage = async ({ params }: PageProps) => {
  const { branch, id } = await params

  const [org, session] = await Promise.all([
    getCachedOrganization(branch),
    readActiveSession()
  ])
  if (!org) notFound()

  const training = await getCachedTrainingByIdentifier(org.id, id)
  if (!training) notFound()

  const user = session?.user
  const canManage = user
    ? await isOrgInScope(user, training.organizationId)
    : false

  const masa = masaPenetapanKelulusan({
    endDate: training.endDate,
    role: user?.role ?? ''
  })
  const canEditPassing = canManage && masa.terbuka
  const passingDeadline = masa.batasAkhir

  return (
    <TrainingDetailView
      training={training}
      organizationName={org.name}
      canManage={canManage}
      canEditPassing={canEditPassing}
      passingDeadline={passingDeadline}
    />
  )
}

export default TrainingPage
