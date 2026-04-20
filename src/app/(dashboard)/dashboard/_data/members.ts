import { cacheLife, cacheTag } from 'next/cache'
import { readMemberAggregates, readDescendantMembers } from '~/db/query/member'

export async function getCachedMemberAggregates(filters: any) {
  'use cache'
  cacheLife('minutes')
  cacheTag('members')

  return readMemberAggregates(filters)
}

export async function getCachedDescendantMembers(
  parentId: string,
  filters: any
) {
  'use cache'
  cacheLife('minutes')
  cacheTag('members')

  return readDescendantMembers(parentId, filters)
}
