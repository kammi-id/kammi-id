import { cacheLife, cacheTag } from 'next/cache'
import {
  readOrganization,
  countOrganization,
  readOrgHierarchyChain,
  type Organization,
  type OrganizationFilters
} from '~/db/query/organization'

export type { Organization }

export async function getCachedOrganization(slug: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('organizations')

  const [org] = await readOrganization({ slug })
  return org
}

export async function getCachedOrganizations(filters: OrganizationFilters) {
  'use cache'
  cacheLife('minutes')
  cacheTag('organizations')

  return readOrganization(filters)
}

export async function getCachedOrganizationCount(filters: OrganizationFilters) {
  'use cache'
  cacheLife('minutes')
  cacheTag('organizations')

  return countOrganization(filters)
}

export async function getCachedOrgHierarchyChain(orgId: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('organizations')

  return readOrgHierarchyChain(orgId)
}
