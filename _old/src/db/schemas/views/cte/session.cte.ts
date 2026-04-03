import { qb } from './common.cte'
import { session as table } from '../../table/session.sql'
import { userCTE, type User } from './user.cte'
import { sql, eq, getColumns } from 'drizzle-orm'

const { ...columns } = getColumns(table)

export const sessionCTE = qb.$with('session_cte').as(
  qb
    .with(userCTE)
    .select({
      ...columns,
      user: sql<
        Pick<
          User,
          | 'id'
          | 'name'
          | 'displayName'
          | 'role'
          | 'connectedMember'
          | 'connectedOrganization'
        >
      >`
        json_build_object(
          'id', ${userCTE.id},
          'name', ${userCTE.name},
          'displayName', ${userCTE.displayName},
          'role', ${userCTE.role},
          'connectedMember', ${userCTE.connectedMember},
          'connectedOrganization', ${userCTE.connectedOrganization}
        )
      `.as('user')
    })
    .from(table)
    .leftJoin(userCTE, eq(table.userId, userCTE.id))
)

export type Session = Omit<typeof table.$inferSelect, 'userId'> & {
  user: Pick<
    User,
    | 'id'
    | 'name'
    | 'displayName'
    | 'role'
    | 'connectedMember'
    | 'connectedOrganization'
  >
}
