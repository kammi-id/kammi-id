'use server'

import { requireKekaderanAccess } from '~/lib/auth/kekaderan'
import {
  readOrganizationsByMemberTotal,
  type OrganizationKeysetCursor
} from '~/db/query/organization'
import { type Organization } from '~/app/(dashboard)/dashboard/_data/organizations'
import { deriveMemberTotalFilters } from './utils'
import { type MemberBranchData } from './types'

export type LoadMoreOrganizationsInput = {
  organizationId: string
  activeType?: string
  name?: string
  orgType?: Organization['type'][]
  limit: number
  cursor: OrganizationKeysetCursor | null
}

export type LoadMoreOrganizationsResult = {
  items: MemberBranchData[]
  nextCursor: OrganizationKeysetCursor | null
  hasMore: boolean
}

/**
 * One "Muat lagi" batch of Daftar Struktur (tiket 06) — the client-driven
 * half of the keyset the server renders the first batch of. Reachable
 * directly by any signed-in client, so `organizationId` is not trusted until
 * `requireKekaderanAccess` says it is: the same Cakupan check
 * `members-page-content.tsx` runs before the *first* batch runs again here,
 * for every batch after it. A denial returns an empty page rather than
 * throwing — the client has nothing useful to do with a rejected batch
 * beyond simply not appending it.
 */
export const loadMoreOrganizations = async (
  input: LoadMoreOrganizationsInput
): Promise<LoadMoreOrganizationsResult> => {
  const scope = await requireKekaderanAccess(input.organizationId)
  if (!scope) {
    return { items: [], nextCursor: null, hasMore: false }
  }

  const memberTotalFilters = deriveMemberTotalFilters(input.activeType)

  // limit + 1: the extra row (if it comes back) is how "Muat lagi" learns
  // there is a next batch at all, without a separate count query.
  const rows = await readOrganizationsByMemberTotal(
    {
      parentId: input.organizationId,
      name: input.name,
      type: input.orgType,
      ...memberTotalFilters
    },
    { limit: input.limit + 1, cursor: input.cursor ?? undefined }
  )

  const hasMore = rows.length > input.limit
  const page = hasMore ? rows.slice(0, input.limit) : rows
  const last = page[page.length - 1]
  const nextCursor = last ? { total: last.total, id: last.id } : null

  const items: MemberBranchData[] = page.map((org) => ({
    ...org,
    pemandu: 0,
    instruktur: 0
  }))

  return { items, nextCursor, hasMore }
}
