import { db } from '../db'
import { organization } from '../schema/organization.sql'
import { withOrganizationCTE, type Organization } from './cte/organization'
export type { Organization }
import {
  inArray,
  eq,
  and,
  ilike,
  isNull,
  type SQL,
  asc,
  desc,
  count,
  sql
} from 'drizzle-orm'
import { type DBExecutor } from '../types'

import { createUser } from './user'
import { generatePassword, hashPassword } from '~/lib/utils/user'

export const fetchAllowedOrgIds = async (user: {
  role: string
  connectedOrganization?: { id: string } | null
  connectedOrganizationId?: string | null
}): Promise<string[]> => {
  const connectedOrgId =
    user.connectedOrganization?.id || user.connectedOrganizationId

  if (user.role === 'root') {
    const result = await db.select({ id: organization.id }).from(organization)
    return result.map((r) => r.id)
  }

  if (!connectedOrgId) {
    return []
  }

  const userOrg = await db
    .select({ type: organization.type })
    .from(organization)
    .where(eq(organization.id, connectedOrgId))
    .limit(1)
    .then((res) => res[0])

  if (!userOrg) {
    return []
  }

  if (user.role === 'humas') {
    return [connectedOrgId]
  }

  try {
    const result = await db.execute(sql`
      WITH RECURSIVE org_hierarchy AS (
        SELECT id FROM ${organization} WHERE id = ${connectedOrgId}
        UNION ALL
        SELECT o.id FROM ${organization} o
        JOIN org_hierarchy oh ON o.parent_id = oh.id
      )
      SELECT id FROM org_hierarchy
    `)

    const rows = (result as any).rows || result
    const ids = (Array.isArray(rows) ? rows : []).map((r: any) => r.id)
    return ids
  } catch (error) {
    return [connectedOrgId]
  }
}

type OrganizationInsertValues = typeof organization.$inferInsert
export type OrganizationFilters = {
  id?: string[]
  slug?: string
  name?: string
  type?: Organization['type'][]
  level?: number[]
  parentId?: string[] | null
  isNonActive?: boolean
  // Pagination & Sorting
  limit?: number
  offset?: number
  orderBy?: {
    column: keyof Organization | 'childrenCount'
    direction: 'asc' | 'desc'
  }[]
}

export const createOrganization = async (
  values: OrganizationInsertValues
): Promise<
  Array<
    Organization & {
      credentials: { displayName: string; name: string; password: string }[]
    }
  >
> => {
  return await db.transaction(async (tx) => {
    const [newOrg] = await tx.insert(organization).values(values).returning({
      id: organization.id,
      slug: organization.slug,
      name: organization.name,
      type: organization.type
    })

    const roles: Array<'bph' | 'bpk' | 'bpw' | 'humas' | 'root'> = [
      'bph',
      'bpk',
      'bpw',
      'humas'
    ]
    if (newOrg.type === 'pp') roles.push('root')

    const credentials: {
      displayName: string
      name: string
      password: string
    }[] = []

    for (const role of roles) {
      let roleDisplay = role.toUpperCase()
      let usernamePrefix: string = role

      if (role === 'bpw') {
        if (newOrg.type === 'pp') {
          roleDisplay = 'BPW'
          usernamePrefix = 'bpw'
        } else if (newOrg.type === 'pw') {
          roleDisplay = 'BPD'
          usernamePrefix = 'bpd'
        } else if (newOrg.type === 'pd' || newOrg.type === 'pdln') {
          roleDisplay = 'BPKOM'
          usernamePrefix = 'bpkom'
        } else {
          continue
        }
      }

      const username =
        role === 'root' ? 'root' : `${usernamePrefix}-${newOrg.slug}`
      const password = generatePassword()
      const passwordHash = await hashPassword(password)

      const displayName = `${roleDisplay} ${newOrg.name}`
      credentials.push({
        displayName,
        name: username,
        password
      })

      await createUser(
        {
          name: username,
          displayName,
          passwordHash,
          role,
          connectedOrganizationId: newOrg.id
        },
        tx
      )
    }

    const [org] = await tx
      .with(withOrganizationCTE)
      .select()
      .from(withOrganizationCTE)
      .where(eq(withOrganizationCTE.id, newOrg.id))

    return [{ ...org, credentials }]
  })
}

export const countOrganization = async (
  filters: OrganizationFilters = {}
): Promise<number> => {
  const where: SQL[] = []

  if (filters.id) where.push(inArray(withOrganizationCTE.id, filters.id))
  if (filters.slug) where.push(eq(withOrganizationCTE.slug, filters.slug))
  if (filters.name)
    where.push(ilike(withOrganizationCTE.name, `%${filters.name}%`))
  if (filters.type) where.push(inArray(withOrganizationCTE.type, filters.type))
  if (filters.level)
    where.push(inArray(withOrganizationCTE.level, filters.level))
  if (filters.parentId !== undefined) {
    where.push(
      filters.parentId === null
        ? isNull(withOrganizationCTE.parentId)
        : inArray(withOrganizationCTE.parentId, filters.parentId)
    )
  }
  if (filters.isNonActive !== undefined)
    where.push(eq(withOrganizationCTE.isNonActive, filters.isNonActive))

  const [result] = await db
    .with(withOrganizationCTE)
    .select({ count: count() })
    .from(withOrganizationCTE)
    .where(and(...where))

  return Number(result?.count ?? 0)
}

export const readOrganization = async (
  filters: OrganizationFilters = {},
  tx?: DBExecutor
): Promise<Array<Organization>> => {
  const executor = tx || db
  const where: SQL[] = []

  if (filters.id) where.push(inArray(withOrganizationCTE.id, filters.id))
  if (filters.slug) where.push(eq(withOrganizationCTE.slug, filters.slug))
  if (filters.name)
    where.push(ilike(withOrganizationCTE.name, `%${filters.name}%`))
  if (filters.type) where.push(inArray(withOrganizationCTE.type, filters.type))
  if (filters.level)
    where.push(inArray(withOrganizationCTE.level, filters.level))
  if (filters.parentId !== undefined) {
    where.push(
      filters.parentId === null
        ? isNull(withOrganizationCTE.parentId)
        : inArray(withOrganizationCTE.parentId, filters.parentId)
    )
  }
  if (filters.isNonActive !== undefined)
    where.push(eq(withOrganizationCTE.isNonActive, filters.isNonActive))

  const query = executor
    .with(withOrganizationCTE)
    .select({
      id: withOrganizationCTE.id,
      name: withOrganizationCTE.name,
      code: withOrganizationCTE.code,
      slug: withOrganizationCTE.slug,
      codeSlug: withOrganizationCTE.codeSlug,
      type: withOrganizationCTE.type,
      level: withOrganizationCTE.level,
      logo: withOrganizationCTE.logo,
      parentId: withOrganizationCTE.parentId,
      isNonActive: withOrganizationCTE.isNonActive,
      childrenCount: sql`
        (SELECT count(*) FROM ${organization} WHERE parent_id = ${withOrganizationCTE.id})
      `.mapWith(Number)
    })
    .from(withOrganizationCTE)
    .where(and(...where))

  if (filters.orderBy && filters.orderBy.length > 0) {
    const orderClauses = filters.orderBy.map(({ column, direction }) => {
      const orderFn = direction === 'asc' ? asc : desc
      if (column === 'childrenCount') {
        return orderFn(sql`children_count`)
      }
      return orderFn(withOrganizationCTE[column as keyof typeof withOrganizationCTE] as any)
    })
    query.orderBy(...orderClauses)
  } else {
    // Default: type priority (pw → pdln → pd → pk), then numeric code order
    query.orderBy(
      sql`CASE ${withOrganizationCTE.type}
        WHEN 'pp' THEN 0
        WHEN 'pw' THEN 1
        WHEN 'pdln' THEN 2
        WHEN 'pd' THEN 3
        WHEN 'pk' THEN 4
        ELSE 5
      END`,
      sql`(substring(${withOrganizationCTE.code} from '[0-9]+'))::int`,
      asc(withOrganizationCTE.code)
    )
  }

  if (filters.limit !== undefined) {
    query.limit(filters.limit)
  }

  if (filters.offset !== undefined) {
    query.offset(filters.offset)
  }

  return await query
}

export const updateOrganization = async (
  values: Partial<OrganizationInsertValues>,
  id: string
): Promise<Array<Organization>> => {
  return await db.transaction(async (tx) => {
    await tx.update(organization).set(values).where(eq(organization.id, id))

    return await tx
      .with(withOrganizationCTE)
      .select()
      .from(withOrganizationCTE)
      .where(eq(withOrganizationCTE.id, id))
  })
}

export const deleteOrganization = async (id: Array<string>): Promise<void> => {
  await db.delete(organization).where(inArray(organization.id, id))
}

type OrgChainNode = {
  id: string
  name: string
  type: string
  code: string | null
  slug: string
  parentId: string | null
}

export const readOrgHierarchyChain = async (
  orgId: string
): Promise<OrgChainNode[]> => {
  const result = await db.execute(sql`
    WITH RECURSIVE ancestors AS (
      SELECT id, name, type, code, slug, parent_id
      FROM organization
      WHERE id = ${orgId}
      UNION ALL
      SELECT o.id, o.name, o.type, o.code, o.slug, o.parent_id
      FROM organization o
      JOIN ancestors a ON o.id = a.parent_id
    )
    SELECT id, name, type, code, slug, parent_id as "parentId"
    FROM ancestors
    WHERE type != 'pp'
    ORDER BY
      CASE type
        WHEN 'pw' THEN 1
        WHEN 'pdln' THEN 2
        WHEN 'pd' THEN 3
        WHEN 'pk' THEN 4
        ELSE 5
      END ASC
  `)

  const rows = result as unknown as OrgChainNode[]
  return rows
}
