import { db } from '../db'
import { organization as table } from '../schemas/table/organization.sql'
import { organizationView as view } from '../schemas/views/organization.sql'
import { user as userTable } from '../schemas/table/user.sql'
import { userView } from '../schemas/views/user.sql'
import { memberView } from '../schemas/views/member.sql'
import { trainingView } from '../schemas/views/training.sql'
import { managersHistoryView } from '../schemas/views/manager.sql'
import { inArray, eq } from 'drizzle-orm'
import { generatePassword } from '~/lib/auth/password'
import { withError, type WithError } from '~/lib/helper/with-error'

/**
 * Creates new organizations and automatically generates connected administrative user accounts.
 * Registers standard roles (bph, bpk, bpw, humas) and 'root' for the central board.
 *
 * @param values - Array of organization records to insert.
 * @returns A promise resolving to a [Error, undefined] or [undefined, OrganizationWithUsers[]] tuple.
 *          Returns created organizations with their generated administrative users and passwords.
 *
 * @example
 * ```ts
 * const [error, result] = await createOrganization([{ name: 'PW KAMMI DIY', ... }])
 * ```
 */
export const createOrganization = async (
  values: Array<typeof table.$inferInsert>
): WithError<
  Array<
    typeof view.$inferSelect & {
      users: Array<typeof userView.$inferSelect & { password: string }>
    }
  >
> => {
  return await withError(
    db.transaction(async (tx) => {
      const insertedRows = await tx
        .insert(table)
        .values(values)
        .returning({ id: table.id })
        .then((res) => res.map((r) => r.id))

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(trainingView)
      await tx.refreshMaterializedView(managersHistoryView)

      const organizationRows = await tx
        .select()
        .from(view)
        .where(inArray(view.id, insertedRows))

      const userValues = await getOrgUserInsertValues(organizationRows)

      const insertUserRes = await tx
        .insert(userTable)
        .values(userValues)
        .returning({ id: userTable.id })

      const userPasswordMap = new Map(
        userValues.map((u) => [u.name, u.password])
      )
      const insertedUserIds = insertUserRes.map((r) => r.id)

      const userRows = await tx
        .select()
        .from(userView)
        .where(inArray(userView.id, insertedUserIds))

      const orgUserMap = new Map<
        string,
        Array<(typeof userRows)[number] & { password: string }>
      >()

      userRows.forEach((row) => {
        const orgId = row.connectedOrganization?.id
        if (orgId && !orgUserMap.has(orgId)) {
          orgUserMap.set(orgId, [])
        }

        orgUserMap.get(orgId!)?.push({
          ...row,
          password: userPasswordMap.get(row.name) ?? '',
          connectedMember: null
        })
      })

      return organizationRows.map((row) => {
        return {
          ...row,
          users: orgUserMap.get(row.id) ?? []
        }
      })
    })
  )
}

/**
 * Updates an existing organization record and refreshes dependent materialized views.
 *
 * @param id - The ID of the organization to update.
 * @param values - Partial organization record with fields to update.
 * @returns A promise resolving to a [Error, undefined] or [undefined, Organization] tuple.
 */
export const updateOrganization = async (
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

      if (!row) throw new Error('Organisasi tidak ditemukan.')

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(memberView)
      await tx.refreshMaterializedView(trainingView)
      await tx.refreshMaterializedView(managersHistoryView)

      const [updatedRow] = await tx
        .select()
        .from(view)
        .where(eq(view.id, row.id))

      if (!updatedRow) throw new Error('Gagal memperbaharui info organisasi.')

      return updatedRow
    })
  )
}

/**
 * Deletes one or more organization records.
 * Note: Associated administrative users will be automatically deleted via foreign key CASCADE.
 *
 * @param id - Array of organization IDs to delete.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const deleteOrganization = async (
  id: Array<string>
): WithError<void> => {
  return await withError(
    (async () => {
      await db.delete(table).where(inArray(table.id, id))

      await db.refreshMaterializedView(view)
      await db.refreshMaterializedView(memberView)
      await db.refreshMaterializedView(trainingView)
      await db.refreshMaterializedView(managersHistoryView)
    })()
  )
}

const getOrgUserInsertValues = async (
  orgs: Array<typeof view.$inferSelect>
): Promise<Array<typeof userTable.$inferInsert & { password: string }>> => {
  return await Promise.all(
    orgs.flatMap((org) => {
      const roles = [
        'bph',
        'bpk',
        'bpw',
        'humas',
        org.type === 'pp' ? 'root' : undefined
      ] satisfies Array<(typeof userTable.$inferInsert)['role'] | undefined>

      return roles.filter(Boolean).map(async (role) => {
        const password = generatePassword()
        const passwordHash = await Bun.password.hash(password)

        return {
          name:
            role !== 'root'
              ? `${role}-${org.type}${org.type !== 'pp' ? `-${org.slug}` : ''}`
              : role,
          displayName:
            role !== 'root' ? `${role?.toLocaleUpperCase()} ${org.name}` : role,
          role: role!,
          connectedOrganizationId: org.id,
          passwordHash,
          password
        }
      })
    })
  )
}
