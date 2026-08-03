import { cacheLife, cacheTag } from 'next/cache'
import {
  readMemberAggregates,
  readDescendantMembers,
  readMemberYearDistribution,
  readMemberDistributionByOrgType,
  readMemberByRegisterNumber,
  type MemberFilters,
  type MemberAggregatesFilters
} from '~/db/query/member'
import { readMemberTrainingHistory } from '~/db/query/training'
import { readMemberAcademic } from '~/db/query/academic'
import { readMemberCareer } from '~/db/query/career'
import { readMemberOrganizationHistory } from '~/db/query/organization-history'

type ScopedUser = { role: string; connectedOrganizationId: string | null }

type DescendantMemberFilters = MemberFilters & {
  limit?: number
  offset?: number
  user: ScopedUser
}

export async function getCachedMemberAggregates(
  filters: MemberAggregatesFilters & { user: ScopedUser }
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

export async function getCachedMemberDistributionByOrgType(
  orgType: 'pw' | 'pd' | 'pdln' | 'pk',
  allowedOrgIds: string[]
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readMemberDistributionByOrgType(orgType, allowedOrgIds)
}

export async function getCachedMemberByRegisterNumber(registerNumber: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readMemberByRegisterNumber(registerNumber)
}

export async function getCachedMemberTrainingHistory(memberId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')
  cacheTag('dauroh')

  return readMemberTrainingHistory(memberId)
}

export async function getCachedMemberAcademic(memberId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readMemberAcademic(memberId)
}

export async function getCachedMemberCareer(memberId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readMemberCareer(memberId)
}

export async function getCachedMemberOrganizationHistory(memberId: string) {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readMemberOrganizationHistory(memberId)
}
