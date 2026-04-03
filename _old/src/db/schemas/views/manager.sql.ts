import { pgMaterializedView } from 'drizzle-orm/pg-core'
import { organizationWithHierarchyCTE as orgCTE } from './cte/organization.cte'
import {
  organizationManagerialSummaryCTE as managerSummaryCTE,
  type ManagerialPeriod
} from './cte/manager.cte'
import { sql, eq } from 'drizzle-orm'

export const managersHistoryView = pgMaterializedView('managers_history_view')
  .withNoData()
  .as((qb) =>
    qb
      .with(orgCTE, managerSummaryCTE)
      .select({
        id: orgCTE.id,
        name: orgCTE.name,
        slug: orgCTE.slug,
        code: orgCTE.code,
        codeSlug: orgCTE.codeSlug,
        type: orgCTE.type,
        logo: orgCTE.logo,
        managerialPeriods: sql<Array<ManagerialPeriod>>`
          coalesce(
            ${managerSummaryCTE.periods},
            '[]'::json
          )
        `.as('managerial_periods')
      })
      .from(orgCTE)
      .innerJoin(managerSummaryCTE, eq(orgCTE.id, managerSummaryCTE.id))
  )
