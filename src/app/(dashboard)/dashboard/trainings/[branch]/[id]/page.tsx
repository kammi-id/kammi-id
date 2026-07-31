import { notFound } from 'next/navigation'
import { TrainingDetailView } from '~/app/(dashboard)/dashboard/trainings/_components/training-detail-view'
import { isOrgInScope } from '~/db/query/organization'
import { readActiveSession } from '~/lib/auth/cookies'
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

  const endDate = new Date(training.endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysSinceEnd = Math.floor(
    (today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const isCompleted = today > endDate
  const canEditPassing = canManage && isCompleted && daysSinceEnd <= 30

  const passingDeadline = isCompleted
    ? new Date(endDate.getTime() + 30 * 24 * 60 * 60 * 1000)
    : null

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
