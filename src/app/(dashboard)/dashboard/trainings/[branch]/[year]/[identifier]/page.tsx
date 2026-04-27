import { notFound } from "next/navigation"
import { trainingQuery } from "@/db/query/training"
import { TrainingDetailView } from "../_components/training-detail-view"

interface PageProps {
  params: Promise<{
    branch: string
    year: string
    identifier: string
  }>
}

const TrainingPage = async ({ params }: PageProps) => {
  const { branch, year, identifier } = await params

  const training = await trainingQuery.getByIdentifier(
    branch,
    parseInt(year),
    parseInt(identifier)
  )

  if (!training) {
    notFound()
  }

  return <TrainingDetailView training={training} />
}

export default TrainingPage
