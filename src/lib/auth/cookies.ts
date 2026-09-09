import { validateSession } from './api'
import { cookies } from 'next/headers'
import { cache } from 'react'

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof readActiveSession>>
>['user']

export const readActiveSession = cache(async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('kammi_id_session')?.value
  if (!token) {
    return undefined
  }

  const session = await validateSession(token)
  if (!session) {
    return undefined
  }

  return session
})
