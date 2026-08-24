import { readAccessScope } from '~/lib/auth/access-scope'
import { requireKestrukturanReadAccess } from '~/lib/auth/kestrukturan'
import { readBranchDetailPath, type BranchDetail } from './data'

/**
 * The sole public seam for resolving a branches detail route. It binds the
 * caller's Cakupan to the cached path read, then applies the existing
 * Kestrukturan gate without exposing why a path was rejected.
 */
export const readAuthorizedBranchDetail = async (
  slugs: string[]
): Promise<BranchDetail | null> => {
  const scope = await readAccessScope()
  if (!scope?.connectedOrganizationId) return null

  const detail = await readBranchDetailPath(
    scope.connectedOrganizationId,
    slugs
  )
  if (!detail) return null

  return (await requireKestrukturanReadAccess(detail.organization.id))
    ? detail
    : null
}
