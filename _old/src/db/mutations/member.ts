import { db } from '../db'
import {
  member as table,
  memberEducation as educationTable,
  memberCareer as careerTable
} from '../schemas/table/member.sql'
import { memberView as view } from '../schemas/views/member.sql'
import { organizationView } from '../schemas/views/organization.sql'
import { trainingView } from '../schemas/views/training.sql'
import { user as userTable } from '../schemas/table/user.sql'
import { userView } from '../schemas/views/user.sql'
import { managersHistoryView } from '../schemas/views/manager.sql'
import { inArray, eq, and } from 'drizzle-orm'
import { generatePassword } from '~/lib/auth/password'
import { withError, type WithError } from '~/lib/helper/with-error'

/**
 * Creates new members and automatically generates connected user accounts.
 *
 * @param values - Array of member records to insert.
 * @returns A promise resolving to a [Error, undefined] or [undefined, MemberWithUser[]] tuple.
 *          Returns the created members along with their generated usernames and plain-text passwords.
 *
 * @example
 * ```ts
 * const [error, result] = await createMember([{ name: 'Jane Doe', ... }])
 * ```
 */
export const createMember = async (
  values: Array<typeof table.$inferInsert>
): WithError<
  Array<
    typeof view.$inferSelect & {
      user: typeof userView.$inferSelect & { password: string }
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
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(trainingView)
      await tx.refreshMaterializedView(managersHistoryView)

      const memberRows = await tx
        .select()
        .from(view)
        .where(inArray(view.id, insertedRows))

      const userValues = await getMemberUserInsertValues(memberRows)

      const insertUserRes = await tx
        .insert(userTable)
        .values(userValues)
        .returning({ id: userTable.id })

      const userPasswordMap = new Map<string, string>(
        userValues.map((u) => [u.connectedMemberId!, u.password])
      )
      const insertedUserIds = insertUserRes.map((r) => r.id)

      const userRows = await tx
        .select()
        .from(userView)
        .where(inArray(userView.id, insertedUserIds))

      const memberUserMap = new Map<
        string,
        (typeof userRows)[number] & { password: string }
      >()

      userRows.forEach((row) => {
        const memberId = row.connectedMember?.id
        if (memberId) {
          memberUserMap.set(memberId, {
            ...row,
            password: userPasswordMap.get(memberId) ?? '',
            connectedOrganization: null
          })
        }
      })

      return memberRows.map((row) => {
        return {
          ...row,
          user: memberUserMap.get(row.id)!
        }
      })
    })
  )
}

/**
 * Updates an existing member record and refreshes dependent materialized views.
 *
 * @param id - The ID of the member to update.
 * @param values - Partial member record with fields to update.
 * @returns A promise resolving to a [Error, undefined] or [undefined, Member] tuple.
 */
export const updateMember = async (
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

      if (!row) throw new Error('Anggota tidak ditemukan.')

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(trainingView)
      await tx.refreshMaterializedView(managersHistoryView)

      const [updatedRow] = await tx
        .select()
        .from(view)
        .where(eq(view.id, row.id))

      if (!updatedRow) throw new Error('Gagal memperbaharui info anggota.')

      return updatedRow
    })
  )
}

/**
 * Deletes one or more member records.
 * Note: Associated users will be automatically deleted via foreign key CASCADE.
 *
 * @param id - Array of member IDs to delete.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const deleteMember = async (id: Array<string>): WithError<void> => {
  return await withError(
    (async () => {
      await db.delete(table).where(inArray(table.id, id))

      await db.refreshMaterializedView(view)
      await db.refreshMaterializedView(organizationView)
      await db.refreshMaterializedView(trainingView)
      await db.refreshMaterializedView(managersHistoryView)
    })()
  )
}

/**
 * Adds education (academic) records to a member's profile.
 * Refreshes all dependent materialized views to ensure data consistency.
 *
 * @param values - Array of education records to insert.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const addMemberEducation = async (
  values: Array<typeof educationTable.$inferInsert>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      if (values.length > 0) {
        await tx.insert(educationTable).values(values)
      }

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(trainingView)
      await tx.refreshMaterializedView(managersHistoryView)
    })
  )
}

/**
 * Removes one or more education records from a member's profile.
 *
 * @param memberId - The unique ID of the member.
 * @param institutionIds - Array of institution IDs to remove records for.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const removeMemberEducation = async (
  memberId: string,
  institutionIds: Array<string>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      await tx
        .delete(educationTable)
        .where(
          and(
            eq(educationTable.memberId, memberId),
            inArray(educationTable.institutionId, institutionIds)
          )
        )

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(trainingView)
      await tx.refreshMaterializedView(managersHistoryView)
    })
  )
}

/**
 * Adds career (professional) records to a member's profile.
 *
 * @param values - Array of career records to insert.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const addMemberCareer = async (
  values: Array<typeof careerTable.$inferInsert>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      if (values.length > 0) {
        await tx.insert(careerTable).values(values)
      }

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(trainingView)
      await tx.refreshMaterializedView(managersHistoryView)
    })
  )
}

/**
 * Removes one or more career records from a member's profile.
 *
 * @param memberId - The unique ID of the member.
 * @param employerIds - Array of employer IDs to remove records for.
 * @returns A promise resolving to a [Error, undefined] or [undefined, void] tuple.
 */
export const removeMemberCareer = async (
  memberId: string,
  employerIds: Array<string>
): WithError<void> => {
  return await withError(
    db.transaction(async (tx) => {
      await tx
        .delete(careerTable)
        .where(
          and(
            eq(careerTable.memberId, memberId),
            inArray(careerTable.employerId, employerIds)
          )
        )

      await tx.refreshMaterializedView(view)
      await tx.refreshMaterializedView(organizationView)
      await tx.refreshMaterializedView(trainingView)
      await tx.refreshMaterializedView(managersHistoryView)
    })
  )
}

const getMemberUserInsertValues = async (
  members: Array<typeof view.$inferSelect>
): Promise<Array<typeof userTable.$inferInsert & { password: string }>> => {
  return await Promise.all(
    members.map(async (member) => {
      const password = generatePassword()
      const passwordHash = await Bun.password.hash(password)

      return {
        name: member.idNo,
        displayName: member.name,
        role: 'member',
        connectedMemberId: member.id,
        passwordHash,
        password
      }
    })
  )
}
