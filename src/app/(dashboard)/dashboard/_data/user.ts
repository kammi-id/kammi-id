import { cacheLife, cacheTag } from 'next/cache'
import { readUser } from '~/db/query/user'

export async function getCachedUser(userIds: string[]) {
  'use cache'
  cacheLife('hours')
  cacheTag('user')

  return readUser({ id: userIds })
}
