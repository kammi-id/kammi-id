import { cacheLife, cacheTag } from 'next/cache'
import {
  readOrganization,
  countOrganization,
  readOrgHierarchyChain,
  readOrganizationsByMemberTotal,
  type Organization,
  type OrganizationFilters,
  type OrganizationMemberTotalFilters,
  type OrganizationKeysetCursor,
  type OrganizationWithMemberTotal
} from '~/db/query/organization'

export type {
  Organization,
  OrganizationMemberTotalFilters,
  OrganizationKeysetCursor,
  OrganizationWithMemberTotal
}

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

/**
 * Satu batch Daftar Struktur, keyset — dipakai baik untuk render pertama
 * (server, tanpa cursor) maupun tiap "Muat lagi" (tiket 06). Tag `kader`
 * ikut dipasang di samping `organizations`: batch ini menghitung Kader lewat
 * `total`, jadi ia wajib basi setiap kali Kader berubah, bukan cuma saat
 * Struktur berubah.
 */
export async function getCachedOrganizationsByMemberTotal(
  filters: OrganizationMemberTotalFilters,
  pagination: { limit: number; cursor?: OrganizationKeysetCursor }
): Promise<OrganizationWithMemberTotal[]> {
  'use cache'
  cacheLife('minutes')
  cacheTag('organizations')
  cacheTag('kader')

  return readOrganizationsByMemberTotal(filters, pagination)
}

export async function getCachedOrgHierarchyChain(orgId: string) {
  'use cache'
  cacheLife('hours')
  cacheTag('organizations')

  return readOrgHierarchyChain(orgId)
}
