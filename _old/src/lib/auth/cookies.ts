import { validateSession } from './session'
import { cache } from 'react'
import { cookies } from 'next/headers'

type Session = NonNullable<Awaited<ReturnType<typeof validateSession>>[1]>

/**
 * Retrieves the currently active session from HTTP cookies.
 * This is a React-cached server function that reads the 'kammi-id-session' cookie
 * and validates it against the database.
 *
 * @returns The active session if found and valid, otherwise `undefined`.
 */
export const getActiveSession = cache(
  async (): Promise<Session | undefined> => {
    const cookieStore = await cookies()
    const token = cookieStore.get('kammi-id-session')?.value ?? undefined
    if (!token) {
      return undefined
    }

    const [error, validSession] = await validateSession(token)
    if (error) {
      return undefined
    }

    return validSession
  }
)
