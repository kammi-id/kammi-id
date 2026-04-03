import { db } from '../db'
import { user as table } from '../schemas/table/user.sql'
import { userView as view } from '../schemas/views/user.sql'
import { organizationView } from '../schemas/views/organization.sql'
import { memberView } from '../schemas/views/member.sql'
import { trainingView } from '../schemas/views/training.sql'
import { managersHistoryView } from '../schemas/views/manager.sql'
import { eq } from 'drizzle-orm'
import { withError, type WithError } from '~/lib/helper/with-error'

/**
 * Updates a user account, with support for password hashing.
 * Automatically refreshes dependent organization, member, and training views.
 *
 * @param id - The ID of the user to update.
 * @param values - Fields to update. includes optional plain-text `password` which will be hashed to `passwordHash`.
 * @returns A promise resolving to a [Error, undefined] or [undefined, User] tuple.
 */
export const updateUser = async (
  id: string,
  values: Partial<
    Omit<typeof table.$inferInsert, 'passwordHash'> & { password?: string }
  >
): WithError<typeof view.$inferSelect> => {
  return await withError(
    db.transaction(async (tx) => {
      const { password, ...rest } = values
      const updateValues: Partial<typeof table.$inferInsert> = { ...rest }

      if (password) {
        updateValues.passwordHash = await Bun.password.hash(password)
      }

      const [row] = await tx
        .update(table)
        .set(updateValues)
        .where(eq(table.id, id))
        .returning({ id: table.id })

      if (!row) throw new Error('User tidak ditemukan.')

      // Refreshing materialized views in case user info is cached/embedded somewhere
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(trainingView)
      await tx.refreshMaterializedView(managersHistoryView)

      const [updatedRow] = await tx
        .select()
        .from(view)
        .where(eq(view.id, row.id))

      if (!updatedRow) throw new Error('Gagal memperbaharui info user.')

      return updatedRow
    })
  )
}
