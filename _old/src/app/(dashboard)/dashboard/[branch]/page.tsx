import type { JSX } from 'react'
import { getActiveSession } from '~/lib/auth/cookies'
import getOrganization from '../_data/organization'
import { redirect, notFound } from 'next/navigation'

const BranchPage = async ({
  params
}: PageProps<'/dashboard/[branch]'>): Promise<JSX.Element> => {
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

  return <p>{organization.name}</p>
}

export default BranchPage
