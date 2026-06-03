import { cacheLife, cacheTag } from 'next/cache'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { count, eq, inArray } from 'drizzle-orm'

export type NetworkStats = {
  wilayah: number
  daerah: number
  komisariat: number
}

export type PWOrg = {
  id: string
  name: string
  code: string
}

// ── Private query helpers ─────────────────────────────────────────────────────
// These functions reference `db` directly. They are NOT 'use cache' functions.
// `'use cache'` cannot serialize class instances (like Drizzle's db object) as
// closure variables for cache key generation. By separating the db logic here,
// the cached wrappers below only capture serializable function references.

const _fetchNetworkStats = async (): Promise<NetworkStats> => {
  const results = await db
    .select({ type: organization.type, total: count() })
    .from(organization)
    .where(inArray(organization.type, ['pw', 'pd', 'pdln', 'pk']))
    .groupBy(organization.type)

  const map: Record<string, number> = {}
  for (const r of results) map[r.type] = r.total

  return {
    wilayah: map['pw'] ?? 0,
    daerah: (map['pd'] ?? 0) + (map['pdln'] ?? 0),
    komisariat: map['pk'] ?? 0
  }
}

const _fetchPWOrganizations = async (): Promise<PWOrg[]> =>
  db
    .select({
      id: organization.id,
      name: organization.name,
      code: organization.code
    })
    .from(organization)
    .where(eq(organization.type, 'pw'))
    .orderBy(organization.code)

// ── Public cached exports ─────────────────────────────────────────────────────
// Only call the helper functions above — never reference `db` directly.
// This matches the same pattern used in `_data/site-settings.ts`.

export const getNetworkStats = async (): Promise<NetworkStats> => {
  'use cache'
  cacheLife('hours')
  cacheTag('network-stats')
  return _fetchNetworkStats()
}

export const getPWOrganizations = async (): Promise<PWOrg[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag('pw-orgs')
  return _fetchPWOrganizations()
}
