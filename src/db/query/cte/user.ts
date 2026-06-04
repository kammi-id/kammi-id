import { db } from '../../db'
import { user } from '../../schema/user.sql'
import { withOrganizationCTE, type Organization } from './organization'
import { withMemberCTE, type Member } from './member'
import { getColumns, eq, sql } from 'drizzle-orm'

export const withUserCTE = db.$with('with_user_cte').as(
  db
    .with(withOrganizationCTE, withMemberCTE)
    .select({
      ...(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...safeColumns } = getColumns(user)
        return safeColumns
      })(),
      connectedOrganization: sql<Organization>`json_build_object(
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
      )`.as('connected_organization'),
      connectedMember: sql<Member>`json_build_object(
        'id', ${withMemberCTE.id},
        'name', ${withMemberCTE.name},
        'phone', ${withMemberCTE.phone},
        'addressProvince', ${withMemberCTE.addressProvince},
        'addressCity', ${withMemberCTE.addressCity},
        'addressDistrict', ${withMemberCTE.addressDistrict},
        'addressSubdistrict', ${withMemberCTE.addressSubdistrict},
        'photo', ${withMemberCTE.photo},
        'registerNumber', ${withMemberCTE.registerNumber},
        'organization', ${withMemberCTE.organization},
        'isAlumn', ${withMemberCTE.isAlumn},
        'isSuspended', ${withMemberCTE.isSuspended},
        'isNonActive', ${withMemberCTE.isNonActive}
      )`.as('connected_member')
    })
    .from(user)
    .leftJoin(
      withOrganizationCTE,
      eq(user.connectedOrganizationId, withOrganizationCTE.id)
    )
    .leftJoin(withMemberCTE, eq(user.connectedMemberId, withMemberCTE.id))
)

export type User = Omit<typeof user.$inferSelect, 'passwordHash'> & {
  connectedOrganization: Organization
  connectedMember: Member
}
