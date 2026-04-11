import { validateSession } from './api'
import { cookies } from 'next/headers'
import { cache } from 'react'

export const readActiveSession = cache(
  async (): ReturnType<typeof validateSession> => {
    const cookieStore = await cookies()
    const token = cookieStore.get('kammi_id_session')?.value
    if (!token) {
      return undefined
    }

    return await validateSession(token)
  }
)
