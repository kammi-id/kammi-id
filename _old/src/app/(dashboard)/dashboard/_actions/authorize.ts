'use server'

import { getActiveSession } from '~/lib/auth/cookies'
import z from 'zod'

export type Role = Exclude<
  NonNullable<Awaited<ReturnType<typeof getActiveSession>>>['user']['role'],
  'root'
>

type AuthorizeSessionState =
  | { authorized: true }
  | { authorized: false; error: z.core.$ZodIssue }

const authorizeSessionAction = async (
  roles: Array<Role>
): Promise<AuthorizeSessionState> => {
  const session = await getActiveSession()

  const error = {
    code: 'custom',
    path: [],
    message: 'Antum tidak diizinkan melakukan operasi ini.'
  } as z.core.$ZodIssue

  if (!session) {
    return { authorized: false, error }
  }

  const { role } = session.user

  if (role !== 'root' && !roles.includes(role as Role)) {
    return { authorized: false, error }
  }

  if (!session.user.connectedOrganization) {
    return { authorized: false, error }
  }

  return { authorized: true }
}

export default authorizeSessionAction
