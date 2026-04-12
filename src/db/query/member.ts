import { db } from '../db'
import { member } from '../schema/member.sql'
import { withMemberCTE, type Member } from './cte/member'
import { inArray, eq, and, ilike, type SQL } from 'drizzle-orm'

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
}

export const createMember = async (
  values: MemberInsertValues
): Promise<Array<Member>> => {
  return await db.transaction(async (tx) => {
    const [newMember] = await tx
      .insert(member)
      .values(values)
      .returning({ id: member.id })

    return await tx
      .with(withMemberCTE)
      .select()
      .from(withMemberCTE)
      .where(eq(withMemberCTE.id, newMember.id))
  })
}

export const readMember = async (
  filters: MemberFilters = {}
): Promise<Array<Member>> => {
  const where: SQL[] = []

  if (filters.id) where.push(inArray(withMemberCTE.id, filters.id))
  if (filters.name) where.push(ilike(withMemberCTE.name, `%${filters.name}%`))
  if (filters.registerNumber)
    where.push(
      ilike(withMemberCTE.registerNumber, `%${filters.registerNumber}%`)
    )
  if (filters.organizationId)
    where.push(inArray(withMemberCTE.organizationId, filters.organizationId))
  if (filters.provinceCode)
    where.push(inArray(withMemberCTE.addressProvinceCode, filters.provinceCode))
  if (filters.cityCode)
    where.push(inArray(withMemberCTE.addressCityCode, filters.cityCode))
  if (filters.isAlumn !== undefined)
    where.push(eq(withMemberCTE.isAlumn, filters.isAlumn))
  if (filters.isSuspended !== undefined)
    where.push(eq(withMemberCTE.isSuspended, filters.isSuspended))
  if (filters.isNonActive !== undefined)
    where.push(eq(withMemberCTE.isNonActive, filters.isNonActive))

  return await db
    .with(withMemberCTE)
    .select()
    .from(withMemberCTE)
    .where(and(...where))
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
