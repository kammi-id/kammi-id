import { trainingQuery } from '~/db/query/training'
import { readOrganization, fetchAllowedOrgIds } from '~/db/query/organization'
import { TrainingTable } from './_components/training-table'
import { AddTrainingModal } from './_components/add-training-modal'
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
      <div className='flex flex-col gap-6 p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Daftar Dauroh</h1>
            <p className='text-muted-foreground'>
              Kelola semua sesi dauroh organisasi di sini.
            </p>
          </div>
          <AddTrainingModal
            organizations={organizations.map((o) => ({
              id: o.id,
              name: o.name,
              type: o.type
            }))}
            userRole={userRole}
          />
        </div>

        <TrainingTable data={trainings} />
      </div>
    </AccessGuard>
  )
}
