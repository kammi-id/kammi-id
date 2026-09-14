import { readAccessScope } from '~/lib/auth/access-scope'
import {
  canManageKestrukturan,
  childTypesOf,
  requireKestrukturanReadAccess
} from '~/lib/auth/kestrukturan'
import { strukturKemampuan } from '~/lib/struktur/kemampuan'
import {
  getCachedBranchDetailMemberAggregates,
  readBranchDetailChildren,
  readBranchDetailPath,
  type BranchDetail,
  type BranchChildrenQuery,
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
  slugs: string[],
  childrenQuery?: BranchChildrenQuery
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

  const kemampuan = strukturKemampuan(
    {
      role: authorizedScope.role,
      jenjangAkun: detail.actorJenjang,
      connectedOrganizationId: authorizedScope.connectedOrganizationId
    },
    detail.organization
  )
  const children =
    detail.organization.type === 'pk'
      ? { children: [], childTotal: 0, directChildrenTotal: 0, childPage: 1 }
      : await readBranchDetailChildren(detail.organization.id, childrenQuery)

  // The same pair the grid asks: which Jenjang may sit beneath this one, and
  // does the caller hold `buat` over any of them. Cakupan needs no separate
  // check — the read gate above already admitted this Struktur, and Cakupan is
  // walked from the parent, which is exactly the Struktur in hand.
  //
  // There is no "never your own Struktur" rule here on purpose: creating a child
  // beneath yourself is precisely what `requireKestrukturanCreateAccess` allows,
  // and the same seam enforces it when the form posts.
  const buatAnak = childTypesOf(detail.organization.type).some((childType) =>
    canManageKestrukturan(
      authorizedScope.role,
      detail.actorJenjang,
      childType,
      'buat'
    )
  )

  return {
    ...detail,
    ...children,
    kemampuan,
    buatAnak,
    memberMetrics: await readMemberMetrics(
      detail.organization.id,
      authorizedScope
    )
  }
}
