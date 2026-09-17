import { db } from '../../db'
import { user } from '../../schema/user.sql'
import { organization } from '../../schema/organization.sql'
import { withOrganizationCTE, type Organization } from './organization'
import { withMemberCTE, type Member } from './member'
import { getColumns, eq, sql } from 'drizzle-orm'

/**
 * `user.connected_organization_id` is the one reference in spec §7 that is
 * **deliberately not** subject to the Terhapus filter, so this join goes to the
 * `organization` table directly and pointedly not through `withOrganizationCTE`.
 *
 * Keadaan Akun is gated at `readActiveSession`/`validateSession` (spec §5.2),
 * and one gate is the whole design. A second one here would not harden
 * anything — it would blank `connectedOrganization` on the administrative
 * surfaces that exist precisely to look at an Akun whose Struktur is gone.
 *
 * `withOrganizationCTE` stays in the `.with()` list below for `withMemberCTE`,
 * which does read through it.
 *
 * This is also why `state` is carried into `connected_organization`: the gate
 * at `validateSession` needs the Struktur's Keadaan on **every** request, and a
 * join that filtered Terhapus would hand it `null` for the one case it exists
 * to catch. Reading the Terhapus row is the point.
 */
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
        'id', ${organization.id},
        'name', ${organization.name},
        'slug', ${organization.slug},
        'code', ${organization.code},
        'codeSlug', ${organization.codeSlug},
        'type', ${organization.type},
        'level', ${organization.level},
        'logo', ${organization.logo},
        'parentId', ${organization.parentId},
        'isNonActive', ${organization.isNonActive},
        'state', ${organization.state}
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
    .leftJoin(organization, eq(user.connectedOrganizationId, organization.id))
    .leftJoin(withMemberCTE, eq(user.connectedMemberId, withMemberCTE.id))
)

export type User = Omit<typeof user.$inferSelect, 'passwordHash'> & {
  connectedOrganization: Organization
  connectedMember: Member
}
