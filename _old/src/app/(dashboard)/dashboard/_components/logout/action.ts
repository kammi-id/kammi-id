'use server'

import { getActiveSession } from '~/lib/auth/cookies'
import { deleteSession } from '~/lib/auth/session'
import { cookies } from 'next/headers'
import z from 'zod'

type LogoutActionState =
  | {
      errors: z.core.$ZodIssue[]
      success?: undefined
    }
  | {
      errors?: undefined
      success: true
    }

export const logoutAction = async (
  _state: LogoutActionState | undefined
): Promise<LogoutActionState> => {
  const session = await getActiveSession()
  if (!session) {
    return {
      errors: [
        {
          code: 'custom',
          path: [],
          message: 'Antum tidak diizinkan melakukan operasi ini.'
        }
      ]
    }
  }

  const [error] = await deleteSession(session.id)
  if (error) {
    return {
      errors: [
        {
          code: 'custom',
          path: [],
          message: 'Terjadi kesalahan saat logout.'
        }
      ]
    }
  }

  const cookieStore = await cookies()
  cookieStore.delete('kammi-id-session')

  return {
    success: true
  }
}

export default logoutAction
