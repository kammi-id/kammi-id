import { pgMaterializedView } from 'drizzle-orm/pg-core'
import { organizationWithHierarchyCTE } from './cte/organization.cte'
import {
  organizationManagerialSummaryCTE,
  type Manager
} from './cte/manager.cte'
import { sql, eq, getColumns } from 'drizzle-orm'

export const organizationView = pgMaterializedView('organization_view')
  .withNoData()
  .as((qb) =>
    qb
      .with(organizationWithHierarchyCTE, organizationManagerialSummaryCTE)
      .select({
        ...getColumns(organizationWithHierarchyCTE),
        managers: sql<Array<Manager>>`
          coalesce(
            ${organizationManagerialSummaryCTE.periods}->0->'managers',
            '[]'::json
          )
        `.as('managers')
      })
      .from(organizationWithHierarchyCTE)
      .leftJoin(
        organizationManagerialSummaryCTE,
        eq(organizationWithHierarchyCTE.id, organizationManagerialSummaryCTE.id)
      )
  )
