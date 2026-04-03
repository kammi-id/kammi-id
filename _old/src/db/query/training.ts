import { db } from '../db'
import { trainingView as table } from '../schemas/views/training.sql'
import { organizationView } from '../schemas/views/organization.sql'
import {
  sql,
  inArray,
  ilike,
  eq,
  and,
  or,
  getColumns,
  asc,
  desc,
  type SQL
} from 'drizzle-orm'
import z from 'zod'
import { withError, type WithError } from '~/lib/helper/with-error'

/**
 * Retrieval parameters for training (dauroh) records.
 */
type GetTrainingParams = {
  /** Filter by training ID(s). */
  id?: Array<string>
  /** Filter by organizer organization ID. */
  organizerId?: string
  /** Filter by scope of organizer — returns trainings from all organizations within the hierarchy of this ID. */
  organizerScopeId?: string
  /** Filter by training type (e.g., 'dm1', 'dm2', etc.). */
  type?: Array<(typeof table.$inferSelect)['type']>
  /** Search by training name. */
  search?: string
  /** Multi-column sort configuration. */
  orderBy?: Partial<Record<keyof typeof table.$inferSelect, 'asc' | 'desc'>>
  /** Maximum number of records to return. Defaults to 1. */
  limit?: number
  /** Number of records to skip. Defaults to 0. */
  offset?: number
}

/**
 * Fetches training (dauroh) records based on provided filters and sorting options.
 *
 * @param params - Query parameters including filters, sorting, and pagination.
 * @returns A promise resolving to a [Error, undefined] or [undefined, Training[]] tuple.
 *
 * @example
 * ```ts
 * const [error, trainings] = await getTraining({ type: ['dm1'], organizerId: 'some-org-id' })
 * ```
 */
export const getTraining = async ({
  id,
  organizerId,
  organizerScopeId,
  type,
  search,
  orderBy,
  limit,
  offset
}: GetTrainingParams): WithError<Array<typeof table.$inferSelect>> => {
  const filters: Array<SQL | undefined> = []

  if (id && id.length) {
    const isUUID = z.uuidv7().array().safeParse(id)
    if (isUUID.success) {
      filters.push(inArray(table.id, isUUID.data))
    }
  }

  if (organizerId) {
    const isUUID = z.uuidv7().safeParse(organizerId)
    if (isUUID.success) {
      filters.push(eq(table.organizerId, isUUID.data))
    }
  }

  if (organizerScopeId) {
    const isUUID = z.uuidv7().safeParse(organizerScopeId)
    if (isUUID.success) {
      filters.push(
        inArray(
          table.organizerId,
          db
            .select({ id: organizationView.id })
            .from(organizationView)
            .where(
              sql`${organizationView.scopeId} @> array[${isUUID.data}]::uuid[]`
            )
        )
      )
    }
  }

  if (type && type.length) {
    filters.push(inArray(table.type, type))
  }

  if (search) {
    filters.push(ilike(table.name, `%${search}%`))
  }

  const sorts: Array<SQL> = []
  if (orderBy) {
    for (const [column, direction] of Object.entries(orderBy)) {
      if (column in table) {
        const col = table[column as keyof typeof table] as any
        sorts.push(direction === 'asc' ? asc(col) : desc(col))
      }
    }
  }

  const columns = getColumns(table)
  return await withError(
    db
      .select(columns)
      .from(table)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(...sorts)
      .limit(limit ?? 1)
      .offset(offset ?? 0)
  )
}
