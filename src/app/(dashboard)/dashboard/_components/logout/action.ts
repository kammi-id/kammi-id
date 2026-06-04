'use server'

import { readActiveSession } from '~/lib/auth/cookies'
import { deleteSession } from '~/lib/auth/api'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export type LogoutFormState = {
  error?: string
}

const logoutFormAction = async (): Promise<LogoutFormState> => {
  const session = await readActiveSession()

  if (!session) {
    return { error: 'Forbidden' }
  }

  await deleteSession([session.id])

  const cookieStore = await cookies()
  cookieStore.delete('kammi_id_session')

  redirect('/login?message=logout_success')
}

export default logoutFormAction
