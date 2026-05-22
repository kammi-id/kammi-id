import { db } from '~/db/db'
import { eq, and, inArray, gte, sql } from 'drizzle-orm'
import {
  training,
  trainingAttendants,
  trainingInstructors
} from '~/db/schema/training.sql'
import { organization } from '~/db/schema/organization.sql'
import { member } from '~/db/schema/member.sql'

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

export type TrainingCreateInput = typeof training.$inferInsert
export type TrainingUpdateInput = Partial<typeof training.$inferInsert>

export const trainingQuery = {
  /**
   * Fetch all trainings with optional filters for organizationId and year.
   */
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

  /**
   * Fetch a single training with its attendants and instructors (including member details).
   */
  getByIdentifier: async (orgId: string, year: number, identifier: number) => {
    // 1. Fetch the training
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

    // 2. Fetch attendants with member details
    const attendants = await db
      .select({
        attendant: trainingAttendants,
        member: member
      })
      .from(trainingAttendants)
      .leftJoin(member, eq(trainingAttendants.memberId, member.id))
      .where(eq(trainingAttendants.trainingId, t.id))

    // 3. Fetch instructors with member details
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

  /**
   * Fetch upcoming trainings (start_date >= today), scoped to given org IDs.
   */
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

  /**
   * Insert a new training.
   * Note: identifier is handled by DB trigger.
   */
  create: async (data: TrainingCreateInput) => {
    const [inserted] = await db.insert(training).values(data).returning()
    return inserted
  },

  /**
   * Update training details.
   */
  update: async (id: string, data: TrainingUpdateInput) => {
    const [updated] = await db
      .update(training)
      .set(data)
      .where(eq(training.id, id))
      .returning()
    return updated
  },

  /**
   * Delete a training.
   */
  delete: async (id: string) => {
    const [deleted] = await db
      .delete(training)
      .where(eq(training.id, id))
      .returning()
    return deleted
  },

  /**
   * Assign a member as a participant.
   */
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

  /**
   * Mark attendance passing status.
   */
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

  /**
   * Remove participant.
   */
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

  /**
   * Assign a member as an instructor.
   */
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

  /**
   * Remove instructor.
   */
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
