import { db } from '../db'
import { memberOrganizationHistory } from '../schema/organization-history.sql'
import { and, eq, desc, count } from 'drizzle-orm'

export type MemberOrganizationHistory =
  typeof memberOrganizationHistory.$inferSelect

export type MemberOrganizationHistoryInsert = {
  position: string
  organization: string
  yearStart: number
  yearEnd: number | null
}

export const readMemberOrganizationHistory = async (
  memberId: string
): Promise<MemberOrganizationHistory[]> => {
  return db
    .select()
    .from(memberOrganizationHistory)
    .where(eq(memberOrganizationHistory.memberId, memberId))
    .orderBy(desc(memberOrganizationHistory.yearStart))
}

export const createMemberOrganizationHistory = async (
  data: MemberOrganizationHistoryInsert,
  memberId: string
): Promise<void> => {
  await db.insert(memberOrganizationHistory).values({ ...data, memberId })
}

export const updateMemberOrganizationHistory = async (
  data: MemberOrganizationHistoryInsert,
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .update(memberOrganizationHistory)
    .set(data)
    .where(
      and(
        eq(memberOrganizationHistory.id, id),
        eq(memberOrganizationHistory.memberId, memberId)
      )
    )
}

/** Separuh prasyarat Hapus Selamanya Kader (ADR 0021). */
export const countMemberOrganizationHistoryByMember = async (
  memberId: string
): Promise<number> => {
  const [row] = await db
    .select({ total: count() })
    .from(memberOrganizationHistory)
    .where(eq(memberOrganizationHistory.memberId, memberId))

  return Number(row?.total ?? 0)
}

export const deleteMemberOrganizationHistory = async (
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .delete(memberOrganizationHistory)
    .where(
      and(
        eq(memberOrganizationHistory.id, id),
        eq(memberOrganizationHistory.memberId, memberId)
      )
    )
}
