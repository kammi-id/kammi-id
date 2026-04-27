import { db } from '@/db/db'
import { eq, and, inArray } from 'drizzle-orm'
import { training, trainingAttendants, trainingInstructors } from '@/db/schema/training.sql'
import { member } from '@/db/schema/member.sql'

export type TrainingFilters = {
  organizationId?: string
  year?: number
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
      year ? eq(training.year, year) : undefined,
    ].filter(Boolean) as any[]

    return await db.query.training.findMany({
      where: and(...where),
      with: {
        organization: true,
      },
    })
  },

  /**
   * Fetch a single training with its attendants and instructors (including member details).
   */
  getByIdentifier: async (orgId: string, year: number, identifier: number) => {
    return await db.query.training.findFirst({
      where: and(
        eq(training.organizationId, orgId),
        eq(training.year, year),
        eq(training.identifier, identifier)
      ),
      with: {
        attendants: {
          with: {
            member: true,
          },
        },
        instructors: {
          with: {
            member: true,
          },
        },
      },
    })
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
    const [updated] = await db.update(training)
      .set(data)
      .where(eq(training.id, id))
      .returning()
    return updated
  },

  /**
   * Delete a training.
   */
  delete: async (id: string) => {
    const [deleted] = await db.delete(training)
      .where(eq(training.id, id))
      .returning()
    return deleted
  },

  /**
   * Assign a member as a participant.
   */
  addAttendant: async (trainingId: string, memberId: string) => {
    const [inserted] = await db.insert(trainingAttendants).values({
      trainingId,
      memberId,
    }).returning()
    return inserted
  },

  /**
   * Mark attendance passing status.
   */
  updateAttendantStatus: async (trainingId: string, memberId: string, isPassing: boolean) => {
    const [updated] = await db.update(trainingAttendants)
      .set({ isPassing })
      .where(and(
        eq(trainingAttendants.trainingId, trainingId),
        eq(trainingAttendants.memberId, memberId)
      ))
      .returning()
    return updated
  },

  /**
   * Remove participant.
   */
  removeAttendant: async (trainingId: string, memberId: string) => {
    const [deleted] = await db.delete(trainingAttendants)
      .where(and(
        eq(trainingAttendants.trainingId, trainingId),
        eq(trainingAttendants.memberId, memberId)
      ))
      .returning()
    return deleted
  },

  /**
   * Assign a member as an instructor.
   */
  addInstructor: async (trainingId: string, memberId: string, role: 'master' | 'assistant_master' | 'administrator' | 'classroom_master' | 'lecturer' | 'observer' | 'ustadz_of_training') => {
    const [inserted] = await db.insert(trainingInstructors).values({
      trainingId,
      memberId,
      role,
    }).returning()
    return inserted
  },

  /**
   * Remove instructor.
   */
  removeInstructor: async (trainingId: string, memberId: string) => {
    const [deleted] = await db.delete(trainingInstructors)
      .where(and(
        eq(trainingInstructors.trainingId, trainingId),
        eq(trainingInstructors.memberId, memberId)
      ))
      .returning()
    return deleted
  },
}
