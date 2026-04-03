import { db } from '../db'
import {
  training as table,
  trainingAttendants as attendantsTable,
  trainingInstructors as instructorsTable
} from '../schemas/table/training.sql'
import { trainingView as view } from '../schemas/views/training.sql'
import { memberView } from '../schemas/views/member.sql'
import { organizationView } from '../schemas/views/organization.sql'
import { managersHistoryView } from '../schemas/views/manager.sql'
import { inArray, eq, and } from 'drizzle-orm'
import { withError, type WithError } from '~/lib/helper/with-error'

/**
 * Creates new training (dauroh) sessions.
 *
 * @param values - Array of training records to insert.
 * @returns A promise resolving to a [Error, undefined] or [undefined, Training[]] tuple.
 */
export const createTraining = async (
  values: Array<typeof table.$inferInsert>
): WithError<Array<typeof view.$inferSelect>> => {
  return await withError(
    db.transaction(async (tx) => {
      const insertedRows = await tx
        .insert(table)
        .values(values)
        .returning({ id: table.id })
        .then((res) => res.map((r) => r.id))

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(managersHistoryView)

      return await tx.select().from(view).where(inArray(view.id, insertedRows))
    })
  )
}

/**
 * Updates an existing training (dauroh) record.
 *
 * @param id - The ID of the training to update.
 * @param values - Partial training record.
 * @returns A promise resolving to a [Error, undefined] or [undefined, Training] tuple.
 */
export const updateTraining = async (
  id: string,
  values: Partial<typeof table.$inferInsert>
): WithError<typeof view.$inferSelect> => {
  return await withError(
    db.transaction(async (tx) => {
      const [row] = await tx
        .update(table)
        .set(values)
        .where(eq(table.id, id))
        .returning({ id: table.id })

      if (!row) throw new Error('Dauroh tidak ditemukan.')

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(managersHistoryView)

      const [updatedRow] = await tx
        .select()
        .from(view)
        .where(eq(view.id, row.id))

      if (!updatedRow) throw new Error('Gagal memperbaharui info dauroh.')

      return updatedRow
    })
  )
}

/**
 * Removes one or more training (dauroh) sessions.
 *
 * @param ids - Array of training IDs to delete.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const deleteTraining = async (ids: Array<string>): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      await tx.delete(table).where(inArray(table.id, ids))

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(managersHistoryView)
    })
  )
}

/**
 * Adds participants (attendants) to a training session.
 *
 * @param values - Array of attendant records to link to the training.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const addTrainingAttendants = async (
  values: Array<typeof attendantsTable.$inferInsert>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      if (values.length > 0) {
        await tx.insert(attendantsTable).values(values)
      }

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(managersHistoryView)
    })
  )
}

/**
 * Removes participants (attendants) from a training session.
 *
 * @param trainingId - The training session ID.
 * @param attendantIds - Array of member IDs to remove.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const removeTrainingAttendants = async (
  trainingId: string,
  attendantIds: Array<string>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      await tx
        .delete(attendantsTable)
        .where(
          and(
            eq(attendantsTable.trainingId, trainingId),
            inArray(attendantsTable.attendantId, attendantIds)
          )
        )

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(managersHistoryView)
    })
  )
}

/**
 * Adds instructors to a training session.
 *
 * @param values - Array of instructor records to link to the training.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const addTrainingInstructors = async (
  values: Array<typeof instructorsTable.$inferInsert>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      if (values.length > 0) {
        await tx.insert(instructorsTable).values(values)
      }

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(managersHistoryView)
    })
  )
}

/**
 * Removes instructors from a training session.
 *
 * @param trainingId - The training session ID.
 * @param instructorIds - Array of member IDs to remove as instructors.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const removeTrainingInstructors = async (
  trainingId: string,
  instructorIds: Array<string>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      await tx
        .delete(instructorsTable)
        .where(
          and(
            eq(instructorsTable.trainingId, trainingId),
            inArray(instructorsTable.instructorId, instructorIds)
          )
        )

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(managersHistoryView)
    })
  )
}
