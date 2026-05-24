import { db } from '~/db/db'
import { eq, and, inArray, gte, sql, desc } from 'drizzle-orm'
import {
  training,
  trainingAttendants,
  trainingInstructors
} from '~/db/schema/training.sql'
import { organization } from '~/db/schema/organization.sql'
import { member } from '~/db/schema/member.sql'

export type TrainingType = 'dm1' | 'dm2' | 'dpmk' | 'tfi' | 'dm3' | 'other'

export type InstructorRole =
  | 'master'
  | 'assistant_master'
  | 'administrator'
  | 'classroom_master'
  | 'lecturer'
  | 'observer'
  | 'ustadz_of_training'

export type MemberTrainingRecord = {
  id: string
  name: string
  type: TrainingType
  year: number
  identifier: number
  startDate: string
  endDate: string
  organizationName: string | null
}

export type MemberTrainingHistory = {
  asAttendant: Array<MemberTrainingRecord & { isPassing: boolean }>
  asInstructor: Array<MemberTrainingRecord & { role: InstructorRole }>
}

export const readMemberTrainingHistory = async (
  memberId: string
): Promise<MemberTrainingHistory> => {
  const [attendantRows, instructorRows] = await Promise.all([
    db
      .select({
        id: training.id,
        name: training.name,
        type: training.type,
        year: training.year,
        identifier: training.identifier,
        startDate: training.startDate,
        endDate: training.endDate,
        isPassing: trainingAttendants.isPassing,
        organizationName: organization.name
      })
      .from(trainingAttendants)
      .innerJoin(training, eq(trainingAttendants.trainingId, training.id))
      .leftJoin(organization, eq(training.organizationId, organization.id))
      .where(eq(trainingAttendants.memberId, memberId))
      .orderBy(desc(training.startDate)),

    db
      .select({
        id: training.id,
        name: training.name,
        type: training.type,
        year: training.year,
        identifier: training.identifier,
        startDate: training.startDate,
        endDate: training.endDate,
        role: trainingInstructors.role,
        organizationName: organization.name
      })
      .from(trainingInstructors)
      .innerJoin(training, eq(trainingInstructors.trainingId, training.id))
      .leftJoin(organization, eq(training.organizationId, organization.id))
      .where(eq(trainingInstructors.memberId, memberId))
      .orderBy(desc(training.startDate))
  ])

  return {
    asAttendant: attendantRows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type as TrainingType,
      year: r.year!,
      identifier: r.identifier,
      startDate: r.startDate,
      endDate: r.endDate,
      isPassing: r.isPassing,
      organizationName: r.organizationName ?? null
    })),
    asInstructor: instructorRows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type as TrainingType,
      year: r.year!,
      identifier: r.identifier,
      startDate: r.startDate,
      endDate: r.endDate,
      role: r.role as InstructorRole,
      organizationName: r.organizationName ?? null
    }))
  }
}

export type TrainingFilters = {
  organizationId?: string
  year?: number
}

export type UpcomingTraining = {
  id: string
  name: string
  startDate: string
  endDate: string
  registrationDeadline: string | null
  type: 'dm1' | 'dm2' | 'dpmk' | 'tfi' | 'dm3' | 'other'
  year: number
  identifier: number
  organization: {
    id: string
    name: string
    slug: string
    codeSlug: string
  }
}

export type TrainingCreateInput = Omit<typeof training.$inferInsert, 'identifier'> & { identifier?: number }
export type TrainingUpdateInput = Partial<typeof training.$inferInsert>

export const trainingQuery = {
  getAll: async (filters: TrainingFilters = {}) => {
    const { organizationId, year } = filters

    const where = [
      organizationId ? eq(training.organizationId, organizationId) : undefined,
      year ? eq(training.year, year) : undefined
    ].filter(Boolean) as any[]

    const rows = await db
      .select({
        training: training,
        organization: organization
      })
      .from(training)
      .leftJoin(organization, eq(training.organizationId, organization.id))
      .where(and(...where))

    return rows.map((row) => ({
      ...row.training,
      organization: row.organization
    }))
  },

  getByIdentifier: async (orgId: string, year: number, identifier: number) => {
    const [t] = await db
      .select()
      .from(training)
      .where(
        and(
          eq(training.organizationId, orgId),
          eq(training.year, year),
          eq(training.identifier, identifier)
        )
      )
      .limit(1)

    if (!t) return null

    const attendants = await db
      .select({
        attendant: trainingAttendants,
        member: member
      })
      .from(trainingAttendants)
      .leftJoin(member, eq(trainingAttendants.memberId, member.id))
      .where(eq(trainingAttendants.trainingId, t.id))

    const instructors = await db
      .select({
        instructor: trainingInstructors,
        member: member
      })
      .from(trainingInstructors)
      .leftJoin(member, eq(trainingInstructors.memberId, member.id))
      .where(eq(trainingInstructors.trainingId, t.id))

    return {
      ...t,
      attendants: attendants.map((a) => ({
        ...a.attendant,
        member: a.member
      })),
      instructors: instructors.map((i) => ({
        ...i.instructor,
        member: i.member
      }))
    }
  },

  getUpcoming: async (
    organizationIds?: string[],
    limit = 10
  ): Promise<UpcomingTraining[]> => {
    const today = new Date().toISOString().split('T')[0]

    const where = [
      gte(training.startDate, today),
      organizationIds && organizationIds.length > 0
        ? inArray(training.organizationId, organizationIds)
        : undefined
    ].filter(Boolean) as ReturnType<typeof gte>[]

    const rows = await db
      .select({
        id: training.id,
        name: training.name,
        startDate: training.startDate,
        endDate: training.endDate,
        registrationDeadline: training.registrationDeadline,
        type: training.type,
        year: training.year,
        identifier: training.identifier,
        orgId: organization.id,
        orgName: organization.name,
        orgSlug: organization.slug,
        orgCodeSlug: organization.codeSlug
      })
      .from(training)
      .leftJoin(organization, eq(training.organizationId, organization.id))
      .where(and(...where))
      .orderBy(training.startDate)
      .limit(limit)

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      startDate: row.startDate,
      endDate: row.endDate,
      registrationDeadline: row.registrationDeadline ?? null,
      type: row.type,
      year: row.year!,
      identifier: row.identifier,
      organization: {
        id: row.orgId!,
        name: row.orgName!,
        slug: row.orgSlug!,
        codeSlug: row.orgCodeSlug!
      }
    }))
  },

  // identifier assigned by DB trigger
  create: async (data: TrainingCreateInput) => {
    const [inserted] = await db.insert(training).values(data as typeof training.$inferInsert).returning()
    return inserted
  },

  update: async (id: string, data: TrainingUpdateInput) => {
    const [updated] = await db
      .update(training)
      .set(data)
      .where(eq(training.id, id))
      .returning()
    return updated
  },

  delete: async (id: string) => {
    const [deleted] = await db
      .delete(training)
      .where(eq(training.id, id))
      .returning()
    return deleted
  },

  addAttendant: async (trainingId: string, memberId: string) => {
    const [inserted] = await db
      .insert(trainingAttendants)
      .values({
        trainingId,
        memberId
      })
      .returning()
    return inserted
  },

  updateAttendantStatus: async (
    trainingId: string,
    memberId: string,
    isPassing: boolean
  ) => {
    const [updated] = await db
      .update(trainingAttendants)
      .set({ isPassing })
      .where(
        and(
          eq(trainingAttendants.trainingId, trainingId),
          eq(trainingAttendants.memberId, memberId)
        )
      )
      .returning()
    return updated
  },

  removeAttendant: async (trainingId: string, memberId: string) => {
    const [deleted] = await db
      .delete(trainingAttendants)
      .where(
        and(
          eq(trainingAttendants.trainingId, trainingId),
          eq(trainingAttendants.memberId, memberId)
        )
      )
      .returning()
    return deleted
  },

  addInstructor: async (
    trainingId: string,
    memberId: string,
    role:
      | 'master'
      | 'assistant_master'
      | 'administrator'
      | 'classroom_master'
      | 'lecturer'
      | 'observer'
      | 'ustadz_of_training'
  ) => {
    const [inserted] = await db
      .insert(trainingInstructors)
      .values({
        trainingId,
        memberId,
        role
      })
      .returning()
    return inserted
  },

  removeInstructor: async (trainingId: string, memberId: string) => {
    const [deleted] = await db
      .delete(trainingInstructors)
      .where(
        and(
          eq(trainingInstructors.trainingId, trainingId),
          eq(trainingInstructors.memberId, memberId)
        )
      )
      .returning()
    return deleted
  }
}
