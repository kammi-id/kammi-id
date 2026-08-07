import { db } from '../db'
import { user } from '../schema/user.sql'
import { withUserCTE, type User } from './cte/user'
import { organization } from '../schema/organization.sql'
import { inArray, eq, and, ilike, type SQL } from 'drizzle-orm'
import { type DBExecutor } from '../types'

type UserInsertValues = typeof user.$inferInsert
export type UserFilters = {
  id?: string[]
  name?: string
  displayName?: string
  role?: User['role'][]
  connectedOrganizationId?: string[]
  connectedMemberId?: string[]
}

export const createUser = async (
  values: UserInsertValues,
  tx?: DBExecutor
): Promise<Array<User>> => {
  const execute = async (t: DBExecutor) => {
    const [newUser] = await t
      .insert(user)
      .values(values)
      .returning({ id: user.id })

    return await readUser({ id: [newUser.id] }, t)
  }

  if (tx) return await execute(tx)
  return await db.transaction(async (t) => await execute(t))
}

export const readUser = async (
  filters: UserFilters = {},
  tx?: DBExecutor
): Promise<Array<User>> => {
  const executor = tx || db
  const where: SQL[] = []

  if (filters.id) where.push(inArray(withUserCTE.id, filters.id))
  if (filters.name) where.push(ilike(withUserCTE.name, `%${filters.name}%`))
  if (filters.displayName)
    where.push(ilike(withUserCTE.displayName, `%${filters.displayName}%`))
  if (filters.role) where.push(inArray(withUserCTE.role, filters.role))
  if (filters.connectedOrganizationId)
    where.push(
      inArray(
        withUserCTE.connectedOrganizationId,
        filters.connectedOrganizationId
      )
    )
  if (filters.connectedMemberId)
    where.push(
      inArray(withUserCTE.connectedMemberId, filters.connectedMemberId)
    )

  return await executor
    .with(withUserCTE)
    .select()
    .from(withUserCTE)
    .where(and(...where))
}

/**
 * The credential row, plus the two fields that decide whether it may become a
 * session at all.
 *
 * `role` and `strukturState` ride along because login is the one door that does
 * **not** pass through `validateSession`, so `mayHoldSession` has to be asked
 * here separately (spec §5.5) — and asking it must not cost a second round trip
 * on the hot path.
 *
 * Joined to `organization` directly rather than through `withOrganizationCTE`,
 * for the same reason and with the same argument as `withUserCTE` — see the
 * docblock in `./cte/user.ts`. A Terhapus Struktur must arrive here as
 * `'terhapus'`, not as absent.
 */
export const readUserCredential = async (name: string) => {
  return await db
    .select({
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      passwordHash: user.passwordHash,
      role: user.role,
      strukturState: organization.state
    })
    .from(user)
    .leftJoin(organization, eq(user.connectedOrganizationId, organization.id))
    .where(eq(user.name, name))
    .limit(1)
}

export const updateUser = async (
  values: Partial<UserInsertValues>,
  id: string
): Promise<Array<User>> => {
  return await db.transaction(async (tx) => {
    await tx.update(user).set(values).where(eq(user.id, id))

    return await tx
      .with(withUserCTE)
      .select()
      .from(withUserCTE)
      .where(eq(withUserCTE.id, id))
  })
}

export const deleteUser = async (id: Array<string>): Promise<void> => {
  await db.delete(user).where(inArray(user.id, id))
}
