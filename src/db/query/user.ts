import { db } from '../db'
import { user } from '../schema/user.sql'
import { withUserCTE, type User } from './cte/user'
import { inArray, eq, and, ilike, type SQL } from 'drizzle-orm'

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
  values: UserInsertValues
): Promise<Array<User>> => {
  return await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(user)
      .values(values)
      .returning({ id: user.id })

    return await readUser({ id: [newUser.id] })
  })
}

export const readUser = async (
  filters: UserFilters = {}
): Promise<Array<User>> => {
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

  return await db
    .with(withUserCTE)
    .select()
    .from(withUserCTE)
    .where(and(...where))
}

export const readUserCredential = async (name: string) => {
  return await db
    .select({
      name: user.name,
      displayName: user.displayName,
      passwordHash: user.passwordHash
    })
    .from(user)
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
