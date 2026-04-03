import { db } from '../db'
import { userView as table } from '../schemas/views/user.sql'
import { privilegedUserCTE } from '../schemas/views/cte/user.cte'
import { eq, getColumns, and, type SQL } from 'drizzle-orm'
import z from 'zod'
import { withError, type WithError } from '~/lib/helper/with-error'

/**
 * Retrieval parameters for users.
 */
type GetUserParams = {
  /** Filter by user ID (UUID). */
  id?: string
  /** Filter by username. */
  name?: string
  /** Maximum number of records to return. Defaults to 1. */
  limit?: number
  /** Number of records to skip. Defaults to 0. */
  offset?: number
}

/**
 * Fetches user information based on ID or name.
 *
 * @param params - Query parameters including ID, name, and pagination.
 * @returns A promise resolving to a [Error, undefined] or [undefined, User[]] tuple.
 *
 * @example
 * ```ts
 * const [error, users] = await getUser({ name: 'administrator' })
 * ```
 */
export const getUser = async ({
  id,
  name,
  limit,
  offset
}: GetUserParams): WithError<Array<typeof table.$inferSelect>> => {
  const filters: Array<SQL | undefined> = []

  if (id) {
    const isUUID = z.uuidv7().safeParse(id)
    if (isUUID.success) {
      filters.push(eq(table.id, isUUID.data))
    }
  }

  if (name) {
    filters.push(eq(table.name, name))
  }

  const columns = getColumns(table)
  return await withError(
    db
      .select(columns)
      .from(table)
      .where(filters.length ? and(...filters) : undefined)
      .limit(limit ?? 1)
      .offset(offset ?? 0)
  )
}

/**
 * Verifies user credentials for login.
 * This is a secure operation that checks the password hash using Bun's native utilities.
 *
 * @param name - The username to verify.
 * @param password - The plain-text password to check.
 * @returns A promise resolving to a [Error, undefined] or [undefined, true] tuple.
 *          Returns an error message "Username dan/atau password Anda salah." on failure.
 *
 * @example
 * ```ts
 * const [error, isValid] = await verifyUser('john_doe', 'secure-password')
 * if (isValid) { ... }
 * ```
 */
export const verifyUser = async (
  name: string,
  password: string
): WithError<{ id: string }> => {
  return await withError(
    (async () => {
      const [user] = await db
        .with(privilegedUserCTE)
        .select()
        .from(privilegedUserCTE)
        .where(eq(privilegedUserCTE.name, name))

      if (!user) throw new Error('Username dan/atau password Anda salah.')

      const isValid = await Bun.password.verify(password, user.passwordHash)
      if (!isValid) throw new Error('Username dan/atau password Anda salah.')

      return { id: user.id }
    })()
  )
}
