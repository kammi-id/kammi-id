import { readActiveSession } from './cookies'
import { type AccessScope } from '~/db/query/organization'

export { type AccessScope }

/**
 * Resolves the Cakupan of the current caller — the single sanctioned way to
 * turn a session into the scope argument that scoped reads require. Returns
 * null when there is no active session, in which case there is nothing to
 * read and the caller should redirect.
 */
export const readAccessScope = async (): Promise<AccessScope | null> => {
  const session = await readActiveSession()
  if (!session?.user) return null

  return {
    role: session.user.role,
    connectedOrganizationId: session.user.connectedOrganization?.id ?? null
  }
}
