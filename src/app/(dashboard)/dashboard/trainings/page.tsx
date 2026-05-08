import { trainingQuery } from '~/db/query/training'
import { readOrganization, fetchAllowedOrgIds } from '~/db/query/organization'
import { TrainingTable } from './_components/training-table'
import { AddTrainingModal } from './_components/add-training-modal'
import { TrainingSectionCards } from './_components/training-section-cards'
import { TrainingPageHeader } from './_components/training-page-header'
import { AccessGuard } from '~/components/access-guard'
import { readActiveSession } from '~/lib/auth/cookies'

interface TrainingsPageProps {
  searchParams: Promise<{
    organizationId?: string
    year?: string
  }>
}

export default async function TrainingsPage({
  searchParams
}: TrainingsPageProps) {
  const params = await searchParams
  const organizationId = params.organizationId
  const year = params.year ? parseInt(params.year) : undefined

  const session = await readActiveSession()
  const user = session?.user
  const userRole = user?.role || ''

  const [trainings, allOrganizations] = await Promise.all([
    trainingQuery.getAll({ organizationId, year }),
    readOrganization({ isNonActive: false })
  ])

  // Calculate metrics for summary cards
  const currentYear = new Date().getFullYear()
  const typesCount: Record<string, number> = {}
  const orgsWithTraining = new Set<string>()

  trainings.forEach((t) => {
    typesCount[t.type] = (typesCount[t.type] || 0) + 1
    orgsWithTraining.add(t.organization.id)
  })

  const metrics = {
    total: trainings.length,
    thisYear: trainings.filter((t) => t.year === currentYear).length,
    orgsWithTraining: orgsWithTraining.size,
    typesCount
  }

  // Filter organizations based on user's jurisdiction
  const allowedOrgIds = await fetchAllowedOrgIds({
    role: user?.role || userRole,
    connectedOrganizationId: user?.connectedOrganization?.id || null
  })

  const organizations = allOrganizations.filter((org) =>
    allowedOrgIds.includes(org.id)
  )

  return (
    <AccessGuard allowedRoles={['root', 'bph', 'bpk']}>
      <div className='flex flex-col gap-8 p-6'>
        <div className='flex items-center justify-between gap-4'>
          <TrainingPageHeader
            pageTitle='Daftar Dauroh'
            subTitle='Kelola semua sesi dauroh organisasi di sini.'
          />
          <AddTrainingModal
            organizations={organizations.map((o) => ({
              id: o.id,
              name: o.name,
              type: o.type
            }))}
            userRole={userRole}
          />
        </div>

        <TrainingSectionCards data={metrics} />

        <TrainingTable data={trainings} />
      </div>
    </AccessGuard>
  )
}
