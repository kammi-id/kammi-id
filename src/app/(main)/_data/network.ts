import { cacheLife, cacheTag } from 'next/cache'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { and, count, eq, inArray, isNull } from 'drizzle-orm'

export type NetworkStats = {
  wilayah: number
  daerah: number
  komisariat: number
}

export type PWOrg = {
  id: string
  name: string
  code: string
  slug: string
  type: 'pw'
  isSiteActive: boolean
  isNonActive: boolean
}

// ── Private query helpers ─────────────────────────────────────────────────────
// These functions reference `db` directly. They are NOT 'use cache' functions.
// `'use cache'` cannot serialize class instances (like Drizzle's db object) as
// closure variables for cache key generation. By separating the db logic here,
// the cached wrappers below only capture serializable function references.

// Struktur Terhapus tidak muncul di pohon, di agregat, di pencarian, di mana
// pun (spec §1.4) — dan yang publik melihat adalah "di mana pun" yang paling
// terbuka. Non-Aktif tetap dihitung: ia ada, ia cuma sedang tidak berjalan.
const _fetchNetworkStats = async (): Promise<NetworkStats> => {
  const results = await db
    .select({ type: organization.type, total: count() })
    .from(organization)
    .where(
      and(
        inArray(organization.type, ['pw', 'pd', 'pdln', 'pk']),
        isNull(organization.deletedAt)
      )
    )
    .groupBy(organization.type)

  const map: Record<string, number> = {}
  for (const r of results) map[r.type] = r.total

  return {
    wilayah: map['pw'] ?? 0,
    daerah: (map['pd'] ?? 0) + (map['pdln'] ?? 0),
    komisariat: map['pk'] ?? 0
  }
}

const _fetchPWOrganizations = async (): Promise<PWOrg[]> => {
  const rows = await db
    .select({
      id: organization.id,
      name: organization.name,
      code: organization.code,
      slug: organization.slug,
      isSiteActive: organization.isSiteActive,
      isNonActive: organization.isNonActive
    })
    .from(organization)
    .where(and(eq(organization.type, 'pw'), isNull(organization.deletedAt)))
    .orderBy(organization.code)

  return rows.map((row) => ({ ...row, type: 'pw' as const }))
}

// ── Public cached exports ─────────────────────────────────────────────────────
// Only call the helper functions above — never reference `db` directly.
// This matches the same pattern used in `_data/site-settings.ts`.

export const getNetworkStats = async (): Promise<NetworkStats> => {
  'use cache'
  cacheLife('hours')
  cacheTag('network-stats')
  try {
    return await _fetchNetworkStats()
  } catch {
    return { wilayah: 0, daerah: 0, komisariat: 0 }
  }
}

export const getPWOrganizations = async (): Promise<PWOrg[]> => {
  'use cache'
  cacheLife('hours')
  cacheTag('pw-orgs')
  try {
    return await _fetchPWOrganizations()
  } catch {
    return []
  }
}
