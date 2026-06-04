import { cacheLife, cacheTag } from 'next/cache'
import {
  readOrganization,
  countOrganization,
  type Organization,
  type OrganizationFilters
} from '~/db/query/organization'

export type { Organization }

export const getCachedOrganization = async (slug: string) => {
  'use cache'
  cacheLife('hours')
  cacheTag('organizations')

  const [org] = await readOrganization({ slug })
  return org
}

export const getCachedOrganizations = async (filters: OrganizationFilters) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('organizations')

  return readOrganization(filters)
}

export const getCachedOrganizationCount = async (
  filters: OrganizationFilters
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('organizations')

  return countOrganization(filters)
}
