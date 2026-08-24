import { cacheLife, cacheTag } from 'next/cache'
import { readOrganization, type Organization } from '~/db/query/organization'
import {
  readBranchDetailMemberAggregates,
  type MemberAggregatesFilters,
  type MemberAggregatesResult
} from '~/db/query/member'
import { type AccessScope } from '~/db/query/organization'

export type BranchMemberMetrics = Omit<
  MemberAggregatesResult,
  'organizationId' | 'parentId' | 'level'
> & {
  pemandu: number
  instruktur: number
}

export type BranchDetail = {
  organization: Organization
  breadcrumbs: Organization[]
  parent: Organization | null
  memberMetrics: BranchMemberMetrics
}

type BranchDetailPath = Omit<BranchDetail, 'memberMetrics'>

export const getCachedBranchDetailMemberAggregates = async (
  filters: MemberAggregatesFilters & { user: AccessScope }
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readBranchDetailMemberAggregates(filters)
}

/**
 * Resolves one normal branches URL into the authorized Struktur it names.
 *
 * Each segment is read as a direct child of the prior segment (the caller's
 * connected Struktur anchors the first one), so a URL can never invent a
 * lineage. Every failure returns null: the route uses that one result for its
 * not-found response and never distinguishes a missing, deleted, forged, or
 * out-of-Cakupan Struktur.
 */
export const readBranchDetailPath = async (
  anchorId: string,
  slugs: string[]
): Promise<BranchDetailPath | null> => {
  'use cache'
  cacheLife('hours')
  cacheTag('organizations')

  if (slugs.length === 0) return null

  const [anchor] = await readOrganization({ id: [anchorId] })
  if (!anchor) return null

  let parentId = anchorId
  const breadcrumbs: Organization[] = []

  for (const slug of slugs) {
    const [organization] = await readOrganization({
      slug,
      parentId: [parentId]
    })
    if (!organization) return null

    breadcrumbs.push(organization)
    parentId = organization.id
  }

  const organization = breadcrumbs.at(-1)
  if (!organization) return null

  return {
    organization,
    breadcrumbs,
    parent: breadcrumbs.at(-2) ?? anchor
  }
}
