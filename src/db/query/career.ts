import { db } from '../db'
import { memberCareer } from '../schema/career.sql'
import { and, eq, desc, count } from 'drizzle-orm'

export type MemberCareer = typeof memberCareer.$inferSelect

export type MemberCareerInsert = {
  profession: string
  company: string
  yearStart: number
  yearEnd: number | null
}

export const readMemberCareer = async (
  memberId: string
): Promise<MemberCareer[]> => {
  return db
    .select()
    .from(memberCareer)
    .where(eq(memberCareer.memberId, memberId))
    .orderBy(desc(memberCareer.yearStart))
}

export const createMemberCareer = async (
  data: MemberCareerInsert,
  memberId: string
): Promise<void> => {
  await db.insert(memberCareer).values({ ...data, memberId })
}

export const updateMemberCareer = async (
  data: MemberCareerInsert,
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .update(memberCareer)
    .set(data)
    .where(and(eq(memberCareer.id, id), eq(memberCareer.memberId, memberId)))
}

/** Separuh prasyarat Hapus Selamanya Kader (ADR 0021). */
export const countMemberCareerByMember = async (
  memberId: string
): Promise<number> => {
  const [row] = await db
    .select({ total: count() })
    .from(memberCareer)
    .where(eq(memberCareer.memberId, memberId))

  return Number(row?.total ?? 0)
}

export const deleteMemberCareer = async (
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .delete(memberCareer)
    .where(and(eq(memberCareer.id, id), eq(memberCareer.memberId, memberId)))
}
