import type { JSX } from 'react'
import TrainingData from './_components/data/data'
import TrainingBar from './_components/layout/bar'
import TrainingOverlays from './_components/layout/overlays'
import { TrainingSheetButton } from './_components/form/sheet'
import { getActiveSession } from '~/lib/auth/cookies'
import getOrganization from '../../_data/organization'
import { redirect, notFound } from 'next/navigation'

const TrainingPage = async ({
  params
}: PageProps<'/dashboard/[branch]/training'>): Promise<JSX.Element> => {
  const session = await getActiveSession()

  if (!session) {
    redirect('/login')
  }

  const { branch } = await params

  const [error, organizations] = await getOrganization({
    id: [branch]
  })

  if (error) {
    throw new Error(`Terjadi kesalahan: ${error.message}`)
  }

  if (!organizations.length) {
    notFound()
  }

  const [organization] = organizations

  return (
    <>
      <TrainingBar>
        <TrainingSheetButton />
      </TrainingBar>
      <TrainingData organizerId={organization.id} />
      <TrainingOverlays
        organizerId={organization.id}
        organizerLevel={organization.level}
        organizerOptionsPromise={getOrganization({
          scopeId: organization.id,
          limit: 1000
        })}
      />
    </>
  )
}

export default TrainingPage
