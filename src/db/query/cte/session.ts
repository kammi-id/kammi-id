import { db } from '../../db'
import { session } from '../../schema/session.sql'
import { withUserCTE, type User } from './user'
import { getColumns, eq, sql } from 'drizzle-orm'

export const withSessionCTE = db.$with('with_session_cte').as(
  db
    .with(withUserCTE)
    .select({
      ...getColumns(session),
      user: sql<User>`json_build_object(
        'id', ${withUserCTE.id},
        'name', ${withUserCTE.name},
        'displayName', ${withUserCTE.displayName},
        'role', ${withUserCTE.role},
        'connectedOrganization', ${withUserCTE.connectedOrganization},
        'connectedMember', ${withUserCTE.connectedMember},
        'deletedAt', ${withUserCTE.deletedAt}
      )`.as('user')
    })
    .from(session)
    .leftJoin(withUserCTE, eq(session.userId, withUserCTE.id))
)

export type Session = typeof session.$inferSelect & {
  user: User
}
