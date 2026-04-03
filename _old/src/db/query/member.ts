import { db } from '../db'
import { memberView as table } from '../schemas/views/member.sql'
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
 * Retrieval parameters for members.
 */
type GetMemberParams = {
  /** Filter by member ID (UUID) or ID Number. */
  id?: Array<string>
  /** Filter by organization ID. */
  organizationId?: string
  /** Filter by member status. */
  status?: Array<(typeof table.$inferSelect)['status']>
  /** Search by name, ID number, or phone. */
  search?: string
  /** Filter by mentor certification status. */
  isCertifiedMentor?: boolean
  /** Filter by instructor certification status. */
  isCertifiedInstructor?: boolean
  /** Filter by alumni status. */
  isAnAlumn?: boolean
  /** Filter by suspension status. Defaults to false. */
  isSuspended?: boolean
  /** Multi-column sort configuration. */
  orderBy?: Partial<Record<keyof typeof table.$inferSelect, 'asc' | 'desc'>>
  /** Maximum number of records to return. Defaults to 1. */
  limit?: number
  /** Number of records to skip. Defaults to 0. */
  offset?: number
}

/**
 * Fetches members based on provided filters and sorting options.
 *
 * @param params - Query parameters including filters, sorting, and pagination.
 * @returns A promise resolving to a [Error, undefined] or [undefined, Member[]] tuple.
 *
 * @example
 * ```ts
 * const [error, members] = await getMember({ search: 'John', status: ['ab1'] })
 * ```
 */
export const getMember = async ({
  id,
  organizationId,
  status,
  search,
  isCertifiedMentor,
  isCertifiedInstructor,
  isAnAlumn,
  isSuspended,
  orderBy,
  limit,
  offset
}: GetMemberParams): WithError<Array<typeof table.$inferSelect>> => {
  const filters: Array<SQL | undefined> = []

  if (id && id.length) {
    const isUUID = z.uuidv7().array().safeParse(id)
    if (isUUID.success) {
      filters.push(inArray(table.id, isUUID.data))
    } else {
      filters.push(inArray(table.idNo, id))
    }
  }

  if (organizationId) {
    const isUUID = z.uuidv7().safeParse(organizationId)
    if (isUUID.success) {
      filters.push(
        sql`${table.organizationScopeId} @> array[${isUUID.data}]::uuid[]`
      )
    }
  }

  if (status && status.length) {
    filters.push(inArray(table.status, status))
  }

  if (search) {
    filters.push(
      or(
        ilike(table.name, `%${search}%`),
        ilike(table.idNo, `%${search}%`),
        ilike(table.phone, `%${search}%`)
      )
    )
  }

  // Boolean filters
  if (isCertifiedMentor !== undefined) {
    filters.push(eq(table.isCertifiedMentor, isCertifiedMentor))
  }
  if (isCertifiedInstructor !== undefined) {
    filters.push(eq(table.isCertifiedInstructor, isCertifiedInstructor))
  }
  if (isAnAlumn !== undefined) {
    filters.push(eq(table.isAnAlumn, isAnAlumn))
  }

  // Suspension filter - default to false
  filters.push(eq(table.isSuspended, isSuspended ?? false))

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
