import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dauroh | KAMMI.id',
  description: 'Jadwal dan manajemen dauroh serta pelatihan KAMMI.'
}

import { trainingQuery } from '~/db/query/training'
import { readOrganization, fetchAllowedOrgIds } from '~/db/query/organization'
import { AddTrainingModal } from './_components/add-training-modal'
import { TrainingSectionCards } from './_components/training-section-cards'
import { TrainingPageHeader } from './_components/training-page-header'
import { TrainingGrid } from './_components/training-grid'
import { AccessGuard } from '~/components/access-guard'
import { readActiveSession } from '~/lib/auth/cookies'

const PAGE_SIZE = 12

interface TrainingsPageProps {
  searchParams: Promise<{
    organizationId?: string
    year?: string
    q?: string
    type?: string
    page?: string
  }>
}

export default async function TrainingsPage({
  searchParams
}: TrainingsPageProps) {
  const params = await searchParams
  const organizationId = params.organizationId
  const year = params.year ? parseInt(params.year) : undefined
  const search = params.q ?? ''
  const types = params.type ? params.type.split(',').filter(Boolean) : []
  const page = params.page ? Math.max(1, parseInt(params.page)) : 1

  const session = await readActiveSession()
  const user = session?.user
  const userRole = user?.role ?? ''

  const [result, allOrganizations] = await Promise.all([
    trainingQuery.getAll({
      organizationId,
      year,
      search,
      types,
      page,
      pageSize: PAGE_SIZE
    }),
    readOrganization({ isNonActive: false })
  ])

  const { rows: trainings, totalCount } = result
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  // Metrics use unfiltered count for summary cards
  const allResult = await trainingQuery.getAll({ organizationId, year })
  const allTrainings = allResult.rows
  const currentYear = new Date().getFullYear()
  const typesCount: Record<string, number> = {}
  const orgsWithTraining = new Set<string>()

  allTrainings.forEach((t) => {
    typesCount[t.type] = (typesCount[t.type] || 0) + 1
    if (t.organization?.id) orgsWithTraining.add(t.organization.id)
  })

  const metrics = {
    total: allResult.totalCount,
    thisYear: allTrainings.filter((t) => t.year === currentYear).length,
    orgsWithTraining: orgsWithTraining.size,
    typesCount
  }

  const allowedOrgIds = await fetchAllowedOrgIds({
    role: userRole,
    connectedOrganizationId: user?.connectedOrganization?.id ?? null
  })

  const organizations = allOrganizations.filter((org) =>
    allowedOrgIds.includes(org.id)
  )

  const gridData = trainings
    .filter((t) => t.organization !== null)
    .map((t) => ({
      ...t,
      year: t.year ?? new Date(t.startDate).getFullYear(),
      organization: t.organization!
    }))

  return (
    <AccessGuard allowedRoles={['root', 'bph', 'bpk']}>
      <div className='flex flex-col gap-8 px-4 py-6 md:px-6 md:py-8 lg:px-8'>
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

        <TrainingGrid
          data={gridData}
          pageCount={pageCount}
          totalCount={totalCount}
          currentSearch={search}
          currentTypes={types}
        />
      </div>
    </AccessGuard>
  )
}
