import { unstable_cache } from 'next/cache'
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

const _getNetworkStats = async (): Promise<NetworkStats> => {
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

const _getPWOrganizations = async (): Promise<PWOrg[]> =>
  db
    .select({
      id: organization.id,
      name: organization.name,
      code: organization.code
    })
    .from(organization)
    .where(eq(organization.type, 'pw'))
    .orderBy(organization.code)

export const getNetworkStats = unstable_cache(_getNetworkStats, ['network-stats'], {
  revalidate: 3600,
  tags: ['network-stats']
})

export const getPWOrganizations = unstable_cache(_getPWOrganizations, ['pw-orgs'], {
  revalidate: 3600,
  tags: ['pw-orgs']
})
