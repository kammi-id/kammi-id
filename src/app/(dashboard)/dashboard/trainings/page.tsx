import {
  trainingQuery
} from '@/db/query/training'
import {
  readOrganization
} from '@/db/query/organization'
import {
  TrainingTable
} from './_components/training-table'
import {
  AddTrainingModal
} from './_components/add-training-modal'
import {
  FilterForm
} from './_components/filter-form'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '~/components/shadcn/ui/card'

interface TrainingsPageProps {
  searchParams: Promise<{
    organizationId?: string
    year?: string
  }>
}

export default async function TrainingsPage({ searchParams }: TrainingsPageProps) {
  const params = await searchParams
  const organizationId = params.organizationId
  const year = params.year ? parseInt(params.year) : undefined

  const [trainings, organizations] = await Promise.all([
    trainingQuery.getAll({ organizationId, year }),
    readOrganization({ isNonActive: false })
  ])

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Daftar Pelatihan</h1>
          <p className='text-muted-foreground'>Kelola semua sesi pelatihan organisasi di sini.</p>
        </div>
        <AddTrainingModal
          organizations={organizations.map(o => ({ id: o.id, name: o.name }))}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
          <CardDescription>Saring pelatihan berdasarkan organisasi atau tahun.</CardDescription>
        </CardHeader>
        <CardContent>
          <FilterForm
            initialOrganizationId={organizationId}
            initialYear={year?.toString()}
            organizations={organizations.map(o => ({ id: o.id, name: o.name }))}
          />
        </CardContent>
      </Card>

      <TrainingTable
        data={trainings}
      />
    </div>
  )
}
