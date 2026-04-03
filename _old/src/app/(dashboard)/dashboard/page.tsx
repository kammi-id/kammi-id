import type { JSX } from 'react'
import { getActiveSession } from '~/lib/auth/cookies'
import { redirect } from 'next/navigation'

const DashboardPage = async (): Promise<JSX.Element> => {
  const session = await getActiveSession()

  if (!session) {
    redirect('/login')
  }

  return <p>TODO</p>
}

export default DashboardPage
