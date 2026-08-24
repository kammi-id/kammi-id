import { readAccessScope } from '~/lib/auth/access-scope'
import { requireKestrukturanReadAccess } from '~/lib/auth/kestrukturan'
import {
  getCachedBranchDetailMemberAggregates,
  readBranchDetailPath,
  type BranchDetail,
  type BranchMemberMetrics
} from './data'

const emptyMetrics: BranchMemberMetrics = {
  ab1: 0,
  ab2: 0,
  ab3: 0,
  ikhwan: 0,
  akhwat: 0,
  total: 0,
  pemandu: 0,
  instruktur: 0
}

const readMemberMetrics = async (
  organizationId: string,
  user: Parameters<typeof getCachedBranchDetailMemberAggregates>[0]['user']
): Promise<BranchMemberMetrics> => {
  const [all, pemandu, instruktur] = await Promise.all([
    getCachedBranchDetailMemberAggregates({
      organizationId,
      isAlumn: false,
      user
    }),
    getCachedBranchDetailMemberAggregates({
      organizationId,
      isAlumn: false,
      isCertifiedMentor: true,
      user
    }),
    getCachedBranchDetailMemberAggregates({
      organizationId,
      isAlumn: false,
      isCertifiedInstructor: true,
      user
    })
  ])
  const aggregate = all.find((row) => row.organizationId === organizationId)

  if (!aggregate) return emptyMetrics

  return {
    ...aggregate,
    pemandu:
      pemandu.find((row) => row.organizationId === organizationId)?.total ?? 0,
    instruktur:
      instruktur.find((row) => row.organizationId === organizationId)?.total ??
      0
  }
}

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

  const authorizedScope = await requireKestrukturanReadAccess(
    detail.organization.id
  )
  if (!authorizedScope) return null

  return {
    ...detail,
    memberMetrics: await readMemberMetrics(
      detail.organization.id,
      authorizedScope
    )
  }
}
