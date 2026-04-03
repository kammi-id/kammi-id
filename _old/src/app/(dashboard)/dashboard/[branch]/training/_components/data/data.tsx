import type { JSX } from 'react'
import TrainingTable from './table'
import getTraining from '~/app/(dashboard)/dashboard/_data/training'

type TrainingDataProps = {
  organizerId: string
}

const TrainingData = async ({
  organizerId
}: TrainingDataProps): Promise<JSX.Element> => {
  const [error, trainings] = await getTraining({
    organizerScopeId: organizerId
  })

  if (error) {
    throw new Error(`Terjadi kesalahan: ${error.message}`)
  }

  return <TrainingTable data={trainings} />
}

export default TrainingData
