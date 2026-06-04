import { db } from '../../db'
import { member } from '../../schema/member.sql'
import { withOrganizationCTE, type Organization } from './organization'
import { getColumns, eq, sql } from 'drizzle-orm'

export const withMemberCTE = db.$with('with_member_cte').as(
  db
    .with(withOrganizationCTE)
    .select({
      ...getColumns(member),
      organization: sql<Organization>`json_build_object(
        'id', ${withOrganizationCTE.id},
        'name', ${withOrganizationCTE.name},
        'slug', ${withOrganizationCTE.slug},
        'code', ${withOrganizationCTE.code},
        'codeSlug', ${withOrganizationCTE.codeSlug},
        'type', ${withOrganizationCTE.type},
        'level', ${withOrganizationCTE.level},
        'logo', ${withOrganizationCTE.logo},
        'parentId', ${withOrganizationCTE.parentId},
        'isNonActive', ${withOrganizationCTE.isNonActive}
      )`.as('organization')
    })
    .from(member)
    .leftJoin(
      withOrganizationCTE,
      eq(member.organizationId, withOrganizationCTE.id)
    )
)

type OrgRef = {
  id: string
  name: string
  slug: string
} | null

export type Member = typeof member.$inferSelect & {
  organization: Organization
  orgHierarchy?: {
    pk: OrgRef
    pd: OrgRef
    pw: OrgRef
  } | null
}
