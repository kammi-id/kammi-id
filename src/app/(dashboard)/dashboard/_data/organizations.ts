import { cacheLife, cacheTag } from 'next/cache'
import { readOrganization, countOrganization } from '~/db/query/organization'

export async function getCachedOrganization(slug: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('organizations')

  const [org] = await readOrganization({ slug })
  return org
}

export async function getCachedOrganizations(filters: any) {
  'use cache'
  cacheLife('minutes')
  cacheTag('organizations')

  return readOrganization(filters)
}

export async function getCachedOrganizationCount(filters: any) {
  'use cache'
  cacheLife('minutes')
  cacheTag('organizations')

  return countOrganization(filters)
}
