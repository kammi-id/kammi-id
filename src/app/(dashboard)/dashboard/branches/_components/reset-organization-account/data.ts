import { asc, and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '~/db/db'
import { user } from '~/db/schema/user.sql'
import type { Organization } from '~/db/query/organization'
import type { AccessScope } from '~/lib/auth/access-scope'

const RESETTABLE_ROLES = ['bph', 'bpk', 'bpw', 'humas'] as const

export type ResettableOrganizationAccount = {
  id: string
  username: string
  authority: string
}

const authorityLabel = (
  role: (typeof RESETTABLE_ROLES)[number],
  organizationType: Organization['type']
) => {
  if (role !== 'bpw') return role.toUpperCase()
  if (organizationType === 'pw') return 'BPD'
  if (organizationType === 'pd' || organizationType === 'pdln') return 'BPKOM'
  return 'BPW'
}

/** This read stays uncached: the dialog must reflect the current accounts. */
export const readResettableOrganizationAccounts = async (
  organization: Pick<Organization, 'id' | 'type'>,
  _scope: AccessScope
): Promise<ResettableOrganizationAccount[]> => {
  const accounts = await db
    .select({ id: user.id, username: user.name, role: user.role })
    .from(user)
    .where(
      and(
        eq(user.connectedOrganizationId, organization.id),
        isNull(user.connectedMemberId),
        inArray(user.role, RESETTABLE_ROLES)
      )
    )
    .orderBy(asc(user.name))

  return accounts.flatMap((account) => {
    const role = account.role as (typeof RESETTABLE_ROLES)[number]
    if (!RESETTABLE_ROLES.includes(role)) {
      return []
    }

    return [
      {
        id: account.id,
        username: account.username,
        authority: authorityLabel(role, organization.type)
      }
    ]
  })
}
