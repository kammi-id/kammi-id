import { db } from '../db'
import { member } from '../schema/member.sql'
import { withMemberCTE, type Member } from './cte/member'
import { inArray, eq, and, ilike, sql, desc, type SQL } from 'drizzle-orm'

import { createUser } from './user'
import { generatePassword, hashPassword } from '~/lib/utils/user'
import { organization } from '../schema/organization.sql'

type MemberInsertValues = typeof member.$inferInsert
export type MemberFilters = {
  id?: string[]
  name?: string
  registerNumber?: string
  organizationId?: string[]
  provinceCode?: string[]
  cityCode?: string[]
  isAlumn?: boolean
  isSuspended?: boolean
  isNonActive?: boolean
  status?: ('ab1' | 'ab2' | 'ab3')[]
  gender?: 'ikhwan' | 'akhwat'
}

export type MemberAggregatesFilters = {
  organizationId?: string
}

export type MemberAggregatesResult = {
  organizationId: string
  ab1: number
  ab2: number
  ab3: number
  ikhwan: number
  akhwat: number
  total: number
}

export const readMemberAggregates = async (
  filters: MemberAggregatesFilters = {}
): Promise<Array<MemberAggregatesResult>> => {
  const { organizationId } = filters

  return await db.execute(sql`
    WITH RECURSIVE org_tree AS (
      SELECT id FROM organization
      WHERE ${organizationId ? sql`id = ${organizationId}` : sql`true`}
      UNION ALL
      SELECT o.id FROM organization o
      JOIN org_tree ot ON o.parent_id = ot.id
    )
    SELECT
      m.organization_id as "organizationId",
      count(*) FILTER (WHERE m.status = 'ab1')::int as "ab1",
      count(*) FILTER (WHERE m.status = 'ab2')::int as "ab2",
      count(*) FILTER (WHERE m.status = 'ab3')::int as "ab3",
      count(*) FILTER (WHERE m.gender = 'ikhwan')::int as "ikhwan",
      count(*) FILTER (WHERE m.gender = 'akhwat')::int as "akhwat",
      count(*)::int as "total"
    FROM member m
    JOIN org_tree ot ON m.organization_id = ot.id
    GROUP BY m.organization_id
  `)
  .then(res => res as MemberAggregatesResult[])
}

export const createMember = async (
  values: MemberInsertValues
): Promise<Array<Member>> => {
  return await db.transaction(async (tx) => {
    const [newMember] = await tx.insert(member).values(values).returning({
      id: member.id,
      name: member.name,
      registerNumber: member.registerNumber
    })

    const password = generatePassword()
    const passwordHash = await hashPassword(password)

    await createUser(
      {
        name: newMember.registerNumber,
        displayName: newMember.name,
        passwordHash,
        role: 'member',
        connectedMemberId: newMember.id
      },
      tx
    )

    return await tx
      .with(withMemberCTE)
      .select()
      .from(withMemberCTE)
      .where(eq(withMemberCTE.id, newMember.id))
  })
}

export const readMember = async (
  filters: MemberFilters & { limit?: number; offset?: number } = {}
): Promise<Array<Member>> => {
  const { limit, offset, ...memberFilters } = filters
  const where: SQL[] = []

  if (memberFilters.id) where.push(inArray(withMemberCTE.id, memberFilters.id))
  if (memberFilters.name)
    where.push(ilike(withMemberCTE.name, `%${memberFilters.name}%`))
  if (memberFilters.registerNumber)
    where.push(
      ilike(withMemberCTE.registerNumber, `%${memberFilters.registerNumber}%`)
    )
  if (memberFilters.organizationId)
    where.push(
      inArray(withMemberCTE.organizationId, memberFilters.organizationId)
    )
  if (memberFilters.provinceCode)
    where.push(
      inArray(withMemberCTE.addressProvinceCode, memberFilters.provinceCode)
    )
  if (memberFilters.cityCode)
    where.push(inArray(withMemberCTE.addressCityCode, memberFilters.cityCode))
  if (memberFilters.isAlumn !== undefined)
    where.push(eq(withMemberCTE.isAlumn, memberFilters.isAlumn))
  if (memberFilters.isSuspended !== undefined)
    where.push(eq(withMemberCTE.isSuspended, memberFilters.isSuspended))
  if (memberFilters.isNonActive !== undefined)
    where.push(eq(withMemberCTE.isNonActive, memberFilters.isNonActive))
  if (memberFilters.status)
    where.push(inArray(withMemberCTE.status, memberFilters.status as any))
  if (memberFilters.gender)
    where.push(eq(withMemberCTE.gender, memberFilters.gender as any))

  const query = db
    .with(withMemberCTE)
    .select()
    .from(withMemberCTE)
    .where(and(...where))

  if (limit !== undefined) query.limit(limit)
  if (offset !== undefined) query.offset(offset)

  return await query
}

export const updateMember = async (
  values: Partial<MemberInsertValues>,
  id: string
): Promise<Array<Member>> => {
  return await db.transaction(async (tx) => {
    await tx.update(member).set(values).where(eq(member.id, id))

    return await tx
      .with(withMemberCTE)
      .select()
      .from(withMemberCTE)
      .where(eq(withMemberCTE.id, id))
  })
}

export const deleteMember = async (id: Array<string>): Promise<void> => {
  await db.delete(member).where(inArray(member.id, id))
}

export const readDescendantMembers = async (
  parentId: string,
  filters: MemberFilters & { limit?: number; offset?: number } = {}
): Promise<[Array<Member>, number]> => {
  const { limit = 10, offset = 0, ...memberFilters } = filters
  const where: SQL[] = []

  if (memberFilters.id) where.push(inArray(withMemberCTE.id, memberFilters.id))
  if (memberFilters.name)
    where.push(ilike(withMemberCTE.name, `%${memberFilters.name}%`))
  if (memberFilters.registerNumber)
    where.push(
      ilike(withMemberCTE.registerNumber, `%${memberFilters.registerNumber}%`)
    )
  if (memberFilters.provinceCode)
    where.push(
      inArray(withMemberCTE.addressProvinceCode, memberFilters.provinceCode)
    )
  if (memberFilters.cityCode)
    where.push(inArray(withMemberCTE.addressCityCode, memberFilters.cityCode))
  if (memberFilters.isAlumn !== undefined)
    where.push(eq(withMemberCTE.isAlumn, memberFilters.isAlumn))
  if (memberFilters.isSuspended !== undefined)
    where.push(eq(withMemberCTE.isSuspended, memberFilters.isSuspended))
  if (memberFilters.isNonActive !== undefined)
    where.push(eq(withMemberCTE.isNonActive, memberFilters.isNonActive))
  if (memberFilters.status)
    where.push(inArray(withMemberCTE.status, memberFilters.status as any))
  if (memberFilters.gender)
    where.push(eq(withMemberCTE.gender, memberFilters.gender as any))

  const orgTreeCTE = sql`
    WITH RECURSIVE org_tree AS (
      SELECT id FROM organization WHERE id = ${parentId}
      UNION ALL
      SELECT o.id FROM organization o JOIN org_tree ot ON o.parent_id = ot.id
    )
    SELECT id FROM org_tree
  `

  const dataQuery = db
    .with(withMemberCTE)
    .select()
    .from(withMemberCTE)
    .where(and(inArray(withMemberCTE.organizationId, orgTreeCTE), ...where))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(withMemberCTE.name))

  const countQuery = db
    .with(withMemberCTE)
    .select({ count: sql`count(*)`.mapWith(Number) })
    .from(withMemberCTE)
    .where(and(inArray(withMemberCTE.organizationId, orgTreeCTE), ...where))

  const [data, [countResult]] = await Promise.all([dataQuery, countQuery])

  return [data, countResult?.count ?? 0]
}
