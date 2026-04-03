import { db } from '../db'
import {
  managerialPeriod as periodTable,
  manager as managerTable
} from '../schemas/table/manager.sql'
import { organizationView } from '../schemas/views/organization.sql'
import { managersHistoryView } from '../schemas/views/manager.sql'
import { memberView } from '../schemas/views/member.sql'
import { trainingView } from '../schemas/views/training.sql'
import { inArray, eq, and } from 'drizzle-orm'
import { withError, type WithError } from '~/lib/helper/with-error'

/**
 * Creates new managerial periods for organizations.
 *
 * @param values - Array of managerial period records to insert.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const createManagerialPeriod = async (
  values: Array<typeof periodTable.$inferInsert>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      if (values.length > 0) {
        await tx.insert(periodTable).values(values)
      }
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(managersHistoryView)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(trainingView)
    })
  )
}

/**
 * Updates an existing managerial period.
 *
 * @param id - The unique ID of the managerial period.
 * @param values - Partial record with fields to update.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const updateManagerialPeriod = async (
  id: string,
  values: Partial<typeof periodTable.$inferInsert>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      await tx.update(periodTable).set(values).where(eq(periodTable.id, id))
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(managersHistoryView)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(trainingView)
    })
  )
}

/**
 * Deletes one or more managerial periods and their associated manager records.
 *
 * @param ids - Array of managerial period IDs to delete.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const deleteManagerialPeriod = async (
  ids: Array<string>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      await tx.delete(periodTable).where(inArray(periodTable.id, ids))
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(managersHistoryView)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(trainingView)
    })
  )
}

/**
 * Adds managers to a managerial period.
 *
 * @param values - Array of manager records to insert.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const addManagers = async (
  values: Array<typeof managerTable.$inferInsert>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      if (values.length > 0) {
        await tx.insert(managerTable).values(values)
      }
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(managersHistoryView)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(trainingView)
    })
  )
}

/**
 * Removes managers from a managerial period.
 *
 * @param managerialPeriodId - The ID of the managerial period.
 * @param managerIds - Array of member IDs to remove as managers from this period.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const removeManagers = async (
  managerialPeriodId: string,
  managerIds: Array<string>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      await tx
        .delete(managerTable)
        .where(
          and(
            eq(managerTable.managerialPeriodId, managerialPeriodId),
            inArray(managerTable.managerId, managerIds)
          )
        )
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(managersHistoryView)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(trainingView)
    })
  )
}
