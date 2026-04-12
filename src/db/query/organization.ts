import { db } from '../db'
import { organization } from '../schema/organization.sql'
import { withOrganizationCTE, type Organization } from './cte/organization'
import { inArray, eq, and, ilike, isNull, type SQL } from 'drizzle-orm'

type OrganizationInsertValues = typeof organization.$inferInsert
export type OrganizationFilters = {
  id?: string[]
  name?: string
  type?: Organization['type'][]
  level?: number[]
  parentId?: string[] | null
  isNonActive?: boolean
}

export const createOrganization = async (
  values: OrganizationInsertValues
): Promise<Array<Organization>> => {
  return await db.transaction(async (tx) => {
    const [newOrg] = await tx
      .insert(organization)
      .values(values)
      .returning({ id: organization.id })

    return await tx
      .with(withOrganizationCTE)
      .select()
      .from(withOrganizationCTE)
      .where(eq(withOrganizationCTE.id, newOrg.id))
  })
}

export const readOrganization = async (
  filters: OrganizationFilters = {}
): Promise<Array<Organization>> => {
  const where: SQL[] = []

  if (filters.id) where.push(inArray(withOrganizationCTE.id, filters.id))
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

  return await db
    .with(withOrganizationCTE)
    .select()
    .from(withOrganizationCTE)
    .where(and(...where))
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
