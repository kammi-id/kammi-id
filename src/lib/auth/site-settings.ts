import { readActiveSession } from './cookies'

/**
 * Resolves the organisation of a caller allowed to edit site settings, or
 * null if the caller may not. The privilege is held by `root` and `humas`,
 * and only for a user with a connected organisation to scope the edit to.
 */
export const requireSiteSettingsAccess = async (): Promise<{
  orgId: string
} | null> => {
  const session = await readActiveSession()
  if (!session) return null

  const { role, connectedOrganization } = session.user
  if (role !== 'root' && role !== 'humas') return null

  const orgId = connectedOrganization?.id
  if (!orgId) return null

  return { orgId }
}
