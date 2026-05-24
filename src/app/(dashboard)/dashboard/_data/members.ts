import { cacheLife, cacheTag } from 'next/cache'
import {
  readMemberAggregates,
  readDescendantMembers,
  readMemberYearDistribution,
  type MemberFilters,
  type MemberAggregatesFilters
} from '~/db/query/member'

type DescendantMemberFilters = MemberFilters & { limit?: number; offset?: number }

export async function getCachedMemberAggregates(
  filters: MemberAggregatesFilters
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readMemberAggregates(filters)
}

export async function getCachedMemberYearDistribution(
  organizationIds?: string[]
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readMemberYearDistribution(organizationIds)
}

export async function getCachedDescendantMembers(
  parentId: string,
  filters: DescendantMemberFilters
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readDescendantMembers(parentId, filters)
}
