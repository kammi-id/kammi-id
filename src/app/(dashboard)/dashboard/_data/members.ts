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
  cacheTag('members')

  return readMemberAggregates(filters)
}

export async function getCachedDescendantMembers(
  parentId: string,
  filters: MemberFilters
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('members')

  return readDescendantMembers(parentId, filters)
}
