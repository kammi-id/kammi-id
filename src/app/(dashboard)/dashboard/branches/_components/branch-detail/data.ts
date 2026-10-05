import { cacheLife, cacheTag } from 'next/cache'
import {
  countOrganization,
  readOrganization,
  type Organization
} from '~/db/query/organization'
import {
  readBranchDetailMemberAggregates,
  type MemberAggregatesFilters,
  type MemberAggregatesResult
} from '~/db/query/member'
import { type AccessScope } from '~/db/query/organization'
import { type StrukturKemampuan } from '~/lib/struktur/kemampuan'

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
  children: Organization[]
  childTotal: number
  directChildrenTotal: number
  childPage: number
  kemampuan: StrukturKemampuan
  /**
   * Whether the caller may create a Struktur Anak directly beneath the Struktur
   * being viewed — the `buat` cell of the matrix, aimed at the child rather
   * than at this Struktur.
   *
   * It is deliberately **not** a field of `StrukturKemampuan`: that type answers
   * "what may be done to this row" and is computed per row for twelve cards on
   * the grid, where "may I create beneath it" is a question nobody asks.
   */
  buatAnak: boolean
}

export type BranchDetailPath = Omit<
  BranchDetail,
  | 'memberMetrics'
  | 'children'
  | 'childTotal'
  | 'directChildrenTotal'
  | 'childPage'
  | 'kemampuan'
  | 'buatAnak'
> & {
  actorJenjang: Organization['type']
}

export type BranchChildrenQuery = {
  query?: string
  page?: number
  limit?: number
}

export type BranchDetailChildren = {
  children: Organization[]
  childTotal: number
  directChildrenTotal: number
  childPage: number
}

export const getCachedBranchDetailMemberAggregates = async (
  filters: MemberAggregatesFilters & { user: AccessScope }
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')
  cacheTag('organizations')

  return readBranchDetailMemberAggregates(filters)
}

export const readBranchDetailChildren = async (
  parentId: string,
  { query, page = 1, limit = 8 }: BranchChildrenQuery = {}
): Promise<BranchDetailChildren> => {
  'use cache'
  cacheLife('minutes')
  cacheTag('organizations')

  const pageSize = Number.isFinite(limit) ? Math.max(1, limit) : 8
  const filters = {
    parentId: [parentId],
    name: query || undefined
  }
  const [childTotal, directChildrenTotal] = await Promise.all([
    countOrganization(filters),
    countOrganization({ parentId: [parentId] })
  ])
  const requestedPage = Number.isFinite(page) ? Math.max(1, page) : 1
  const currentPage = Math.min(
    requestedPage,
    Math.max(1, Math.ceil(childTotal / pageSize))
  )
  const children = await readOrganization({
    ...filters,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
    orderBy: [{ column: 'name', direction: 'asc' }]
  })

  return { children, childTotal, directChildrenTotal, childPage: currentPage }
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
    parent: breadcrumbs.at(-2) ?? anchor,
    actorJenjang: anchor.type
  }
}
