import { db } from '../db'
import { sessionView as table } from '../schemas/views/session.sql'
import { eq, getColumns, and, type SQL } from 'drizzle-orm'
import z from 'zod'
import { withError, type WithError } from '~/lib/helper/with-error'

/**
 * Retrieval parameters for sessions.
 */
type GetSessionParams = {
  /** Filter by session ID (UUID). */
  id?: string
  /** Maximum number of records to return. Defaults to 1. */
  limit?: number
  /** Number of records to skip. Defaults to 0. */
  offset?: number
}

/**
 * Fetches sessions by ID with user context.
 *
 * @param params - Query parameters including ID and pagination.
 * @returns A promise resolving to a [Error, undefined] or [undefined, Session[]] tuple.
 *
 * @example
 * ```ts
 * const [error, sessions] = await getSession({ id: 'uuid-v7' })
 * ```
 */
export const getSession = async ({
  id,
  limit,
  offset
}: GetSessionParams): WithError<Array<typeof table.$inferSelect>> => {
  const filters: Array<SQL | undefined> = []

  if (id) {
    const isUUID = z.uuidv7().safeParse(id)
    if (isUUID.success) {
      filters.push(eq(table.id, isUUID.data))
    }
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
