import { db } from '../db'
import { session as table } from '../schemas/table/session.sql'
import { sessionView as view } from '../schemas/views/session.sql'
import { inArray, eq } from 'drizzle-orm'
import { withError, type WithError } from '~/lib/helper/with-error'

/**
 * Creates new user sessions.
 *
 * @param values - Array of session records to insert.
 * @returns A promise resolving to a [Error, undefined] or [undefined, Session[]] tuple.
 */
export const createSession = async (
  values: Array<typeof table.$inferInsert>
): WithError<Array<typeof view.$inferSelect>> => {
  return await withError(
    db.transaction(async (tx) => {
      const insertedRows = await tx
        .insert(table)
        .values(values)
        .returning({ id: table.id })
        .then((res) => res.map((r) => r.id))

      return await tx.select().from(view).where(inArray(view.id, insertedRows))
    })
  )
}

/**
 * Updates an existing session.
 * Note: Only `lastVerifiedAt` is updateable to maintain session integrity.
 *
 * @param id - The ID of the session to update.
 * @param values - Object containing restricted session update fields.
 * @returns A promise resolving to a [Error, undefined] or [undefined, Session] tuple.
 */
export const updateSession = async (
  id: string,
  values: Pick<typeof table.$inferInsert, 'lastVerifiedAt'>
): WithError<typeof view.$inferSelect> => {
  return await withError(
    db.transaction(async (tx) => {
      const [row] = await tx
        .update(table)
        .set(values)
        .where(eq(table.id, id))
        .returning({ id: table.id })

      if (!row) throw new Error('Sesi tidak ditemukan.')

      const [updatedRow] = await tx
        .select()
        .from(view)
        .where(eq(view.id, row.id))

      if (!updatedRow) throw new Error('Gagal memperbaharui info sesi.')

      return updatedRow
    })
  )
}

/**
 * Removes one or more sessions.
 *
 * @param ids - Array of session IDs to delete.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const deleteSession = async (ids: Array<string>): WithError<void> => {
  return await withError(db.delete(table).where(inArray(table.id, ids)))
}
