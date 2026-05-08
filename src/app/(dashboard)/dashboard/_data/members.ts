import { cacheLife, cacheTag } from 'next/cache'
import {
  readMemberAggregates,
  readDescendantMembers,
  type MemberFilters,
  type MemberAggregatesFilters
} from '~/db/query/member'

export async function getCachedMemberAggregates(
  filters: MemberAggregatesFilters
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readMemberAggregates(filters)
}

export async function getCachedDescendantMembers(
  parentId: string,
  filters: MemberFilters
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('kader')

  return readDescendantMembers(parentId, filters)
}
