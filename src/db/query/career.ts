import { db } from '../db'
import { memberCareer } from '../schema/career.sql'
import { and, eq, desc } from 'drizzle-orm'

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

export const deleteMemberCareer = async (
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .delete(memberCareer)
    .where(and(eq(memberCareer.id, id), eq(memberCareer.memberId, memberId)))
}
