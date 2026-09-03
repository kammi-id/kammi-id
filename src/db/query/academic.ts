import { db } from '../db'
import { memberAcademic } from '../schema/academic.sql'
import { and, eq, desc, count } from 'drizzle-orm'

export type MemberAcademic = typeof memberAcademic.$inferSelect

export type MemberAcademicInsert = {
  degree: 'd1' | 'd2' | 'd3' | 'd4' | 's1' | 's2' | 's3' | 'profesi'
  studyProgram: string
  institutionName: string
  institutionData: Record<string, unknown>
  yearStart: number
  yearEnd: number | null
  isGraduated: boolean
}

export const readMemberAcademic = async (
  memberId: string
): Promise<MemberAcademic[]> => {
  return db
    .select()
    .from(memberAcademic)
    .where(eq(memberAcademic.memberId, memberId))
    .orderBy(desc(memberAcademic.yearStart))
}

export const createMemberAcademic = async (
  data: MemberAcademicInsert,
  memberId: string
): Promise<void> => {
  await db.insert(memberAcademic).values({ ...data, memberId })
}

export const updateMemberAcademic = async (
  data: MemberAcademicInsert,
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .update(memberAcademic)
    .set(data)
    .where(
      and(eq(memberAcademic.id, id), eq(memberAcademic.memberId, memberId))
    )
}

/** Separuh prasyarat Hapus Selamanya Kader (ADR 0021). */
export const countMemberAcademicByMember = async (
  memberId: string
): Promise<number> => {
  const [row] = await db
    .select({ total: count() })
    .from(memberAcademic)
    .where(eq(memberAcademic.memberId, memberId))

  return Number(row?.total ?? 0)
}

export const deleteMemberAcademic = async (
  id: string,
  memberId: string
): Promise<void> => {
  await db
    .delete(memberAcademic)
    .where(
      and(eq(memberAcademic.id, id), eq(memberAcademic.memberId, memberId))
    )
}
