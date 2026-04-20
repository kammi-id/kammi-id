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
  count
} from 'drizzle-orm'

import { createUser } from './user'
import { generatePassword, hashPassword } from '~/lib/utils/user'

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
    column: keyof Organization
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
  filters: OrganizationFilters = {}
): Promise<Array<Organization>> => {
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

  const query = db
    .with(withOrganizationCTE)
    .select()
    .from(withOrganizationCTE)
    .where(and(...where))

  if (filters.orderBy && filters.orderBy.length > 0) {
    const orderClauses = filters.orderBy.map(({ column, direction }) => {
      const orderFn = direction === 'asc' ? asc : desc
      return orderFn(withOrganizationCTE[column])
    })
    query.orderBy(...orderClauses)
  } else {
    // Default sorting if no orderBy is provided
    query.orderBy(asc(withOrganizationCTE.level), asc(withOrganizationCTE.code))
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
