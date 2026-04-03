import { qb } from './common.cte'
import { user as table } from '../../table/user.sql'
import { memberCTE, type Member } from './member.cte'
import {
  organizationWithHierarchyCTE,
  type OrganizationWithHierarchy
} from './organization.cte'
import { sql, eq, getColumns } from 'drizzle-orm'

const {
  connectedMemberId,
  connectedOrganizationId,
  passwordHash,
  ...publicColumns
} = getColumns(table)

export const userCTE = qb.$with('user_cte').as(
  qb
    .with(memberCTE, organizationWithHierarchyCTE)
    .select({
      ...publicColumns,
      connectedMember: sql<Pick<
        Member,
        | 'id'
        | 'idNo'
        | 'name'
        | 'photo'
        | 'gender'
        | 'status'
        | 'educations'
        | 'careers'
        | 'isCertifiedMentor'
        | 'isCertifiedInstructor'
        | 'registeredAt'
      > | null>`
        case
          when ${memberCTE.id} is not null then
            json_build_object(
              'id', ${memberCTE.id},
              'idNo', ${memberCTE.idNo},
              'name', ${memberCTE.name},
              'photo', ${memberCTE.photo},
              'gender', ${memberCTE.gender},
              'status', ${memberCTE.status},
              'educations', ${memberCTE.educations},
              'careers', ${memberCTE.careers},
              'isCertifiedMentor', ${memberCTE.isCertifiedMentor},
              'isCertifiedInstructor', ${memberCTE.isCertifiedInstructor},
              'registeredAt', ${memberCTE.registeredAt}
            )
          else null
        end
      `.as('connected_member'),
      connectedOrganization: sql<Pick<
        OrganizationWithHierarchy,
        | 'id'
        | 'name'
        | 'slug'
        | 'code'
        | 'codeSlug'
        | 'type'
        | 'level'
        | 'isActive'
        | 'pd'
        | 'pdln'
        | 'pw'
      > | null>`
        case
          when ${organizationWithHierarchyCTE.id} is not null then
            json_build_object(
              'id', ${organizationWithHierarchyCTE.id},
              'name', ${organizationWithHierarchyCTE.name},
              'slug', ${organizationWithHierarchyCTE.slug},
              'code', ${organizationWithHierarchyCTE.code},
              'codeSlug', ${organizationWithHierarchyCTE.codeSlug},
              'type', ${organizationWithHierarchyCTE.type},
              'level', ${organizationWithHierarchyCTE.level},
              'logo', ${organizationWithHierarchyCTE.logo},
              'isActive', ${organizationWithHierarchyCTE.isActive},
              'pd', ${organizationWithHierarchyCTE.pd},
              'pdln', ${organizationWithHierarchyCTE.pdln},
              'pw', ${organizationWithHierarchyCTE.pw}
            )
          else null
        end
      `.as('connected_organization')
    })
    .from(table)
    .leftJoin(memberCTE, eq(table.connectedMemberId, memberCTE.id))
    .leftJoin(
      organizationWithHierarchyCTE,
      eq(table.connectedOrganizationId, organizationWithHierarchyCTE.id)
    )
)

export const privilegedUserCTE = qb.$with('privileged_user_cte').as(
  qb
    .select({
      id: table.id,
      name: table.name,
      role: table.role,
      passwordHash: table.passwordHash
    })
    .from(table)
)

/**
 * Public user profile.
 * Excludes sensitive fields like password hashes and internal IDs.
 * Includes detailed member profile if connected.
 */
export type User = Omit<
  typeof table.$inferSelect,
  'connectedMemberId' | 'connectedOrganizationId' | 'passwordHash'
> & {
  connectedMember: Pick<
    Member,
    | 'id'
    | 'idNo'
    | 'name'
    | 'photo'
    | 'gender'
    | 'status'
    | 'educations'
    | 'careers'
    | 'isCertifiedMentor'
    | 'isCertifiedInstructor'
    | 'registeredAt'
  > | null
  connectedOrganization: Pick<
    OrganizationWithHierarchy,
    | 'id'
    | 'name'
    | 'slug'
    | 'code'
    | 'codeSlug'
    | 'type'
    | 'level'
    | 'logo'
    | 'isActive'
    | 'pd'
    | 'pdln'
    | 'pw'
  > | null
}

export type PrivilegedUser = Pick<
  typeof table.$inferSelect,
  'id' | 'name' | 'role' | 'passwordHash'
>
