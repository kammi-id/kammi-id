import { db } from '../db'
import { organizationView as table } from '../schemas/views/organization.sql'
import { memberView as memberTable } from '../schemas/views/member.sql'
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
 * Retrieval parameters for organizations.
 */
type GetOrganizationParams = {
  /** Filter by organization ID (UUID), slug, or code. */
  id?: Array<string>
  /** Filter by organization type (e.g., 'pp', 'pw', 'pd', etc.). */
  type?: Array<(typeof table.$inferSelect)['type']>
  /** Filter by scope ID to find organizations within a specific hierarchy. */
  scopeId?: string
  /** Search by name, slug, or code. */
  search?: string
  /** Filter by active status. */
  isActive?: boolean
  /** Multi-column sort configuration. */
  orderBy?: Partial<Record<keyof typeof table.$inferSelect, 'asc' | 'desc'>>
  /** Maximum number of records to return. Defaults to 1. */
  limit?: number
  /** Number of records to skip. Defaults to 0. */
  offset?: number
}

/**
 * Fetches organizations based on provided filters and sorting options,
 * including aggregated member counts per status level.
 *
 * @param params - Query parameters including filters, sorting, and pagination.
 * @returns A promise resolving to a [Error, undefined] or [undefined, Organization[]] tuple.
 *
 * @example
 * ```ts
 * const [error, orgs] = await getOrganization({ type: ['pd'], isActive: true })
 * ```
 */
export const getOrganization = async ({
  id,
  type,
  scopeId,
  search,
  isActive,
  orderBy,
  limit,
  offset
}: GetOrganizationParams): WithError<
  Array<
    typeof table.$inferSelect & {
      ab1Count: number
      ab2Count: number
      ab3Count: number
      memberCount: number
    }
  >
> => {
  const filters: Array<SQL | undefined> = []

  if (id && id.length) {
    const isUUID = z.uuidv7().array().safeParse(id)
    if (isUUID.success) {
      filters.push(inArray(table.id, isUUID.data))
    } else {
      filters.push(
        or(
          inArray(table.slug, id),
          inArray(table.code, id),
          inArray(table.codeSlug, id)
        )
      )
    }
  }

  if (type && type.length) {
    filters.push(inArray(table.type, type))
  }

  if (scopeId) {
    const isUUID = z.uuidv7().safeParse(scopeId)
    if (isUUID.success) {
      filters.push(sql`${table.scopeId} @> array[${isUUID.data}]::uuid[]`)
    }
  }

  if (search) {
    filters.push(
      or(
        ilike(table.name, `%${search}%`),
        ilike(table.slug, `%${search}%`),
        ilike(table.code, `%${search}%`),
        ilike(table.codeSlug, `%${search}%`)
      )
    )
  }

  if (isActive !== undefined) {
    filters.push(eq(table.isActive, isActive))
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
      .select({
        ...columns,
        ab1Count: db
          .$count(
            memberTable,
            and(
              eq(memberTable.status, 'ab1'),
              sql`${table.id} = any(${memberTable.organizationScopeId})`
            )
          )
          .mapWith(Number),
        ab2Count: db
          .$count(
            memberTable,
            and(
              eq(memberTable.status, 'ab2'),
              sql`${table.id} = any(${memberTable.organizationScopeId})`
            )
          )
          .mapWith(Number),
        ab3Count: db
          .$count(
            memberTable,
            and(
              eq(memberTable.status, 'ab3'),
              sql`${table.id} = any(${memberTable.organizationScopeId})`
            )
          )
          .mapWith(Number),
        memberCount: db
          .$count(
            memberTable,
            sql`${table.id} = any(${memberTable.organizationScopeId})`
          )
          .mapWith(Number)
      })
      .from(table)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(...sorts)
      .limit(limit ?? 1)
      .offset(offset ?? 0)
  )
}
