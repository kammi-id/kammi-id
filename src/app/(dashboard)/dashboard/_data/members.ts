import { cacheLife, cacheTag } from 'next/cache'
import {
  readMemberAggregates,
  readDescendantMembers,
  readMemberYearDistribution,
  readMemberDistributionByOrgType,
  type MemberFilters,
  type MemberAggregatesFilters
} from '~/db/query/member'

type DescendantMemberFilters = MemberFilters & {
  limit?: number
  offset?: number
}

export const getCachedMemberAggregates = async (
  filters: MemberAggregatesFilters
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readMemberAggregates(filters)
}

export const getCachedMemberYearDistribution = async (
  organizationIds?: string[]
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readMemberYearDistribution(organizationIds)
}

export const getCachedDescendantMembers = async (
  parentId: string,
  filters: DescendantMemberFilters
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readDescendantMembers(parentId, filters)
}

export const getCachedMemberDistributionByOrgType = async (
  orgType: 'pw' | 'pd' | 'pdln' | 'pk',
  allowedOrgIds: string[]
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readMemberDistributionByOrgType(orgType, allowedOrgIds)
}
