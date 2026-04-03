import { qb } from './common.cte'
import {
  manager as table,
  managerialPeriod as periodTable
} from '../../table/manager.sql'
import { memberCTE, type Member } from './member.cte'
import { sql, eq } from 'drizzle-orm'

export type Manager = Pick<
  Member,
  'id' | 'idNo' | 'name' | 'phone' | 'photo' | 'gender' | 'status'
> &
  Pick<
    typeof table.$inferSelect,
    'role' | 'roleTitle' | 'department' | 'subDepartment' | 'isDailyManager'
  >

export const managerialPeriodCTE = qb.$with('managerial_period_cte').as(
  qb
    .with(memberCTE)
    .select({
      id: periodTable.id,
      organizationId: periodTable.organizationId,
      yearStart: periodTable.yearStart,
      yearEnd: periodTable.yearEnd,
      managers: sql<Array<Manager>>`
        coalesce(
          json_agg(
            json_build_object(
              'id', ${memberCTE.id},
              'idNo', ${memberCTE.idNo},
              'name', ${memberCTE.name},
              'phone', ${memberCTE.phone},
              'photo', ${memberCTE.photo},
              'gender', ${memberCTE.gender},
              'status', ${memberCTE.status},
              'role', ${table.role},
              'roleTitle', ${table.roleTitle},
              'department', ${table.department},
              'subDepartment', ${table.subDepartment},
              'isDailyManager', ${table.isDailyManager}
            )
          ) filter (where ${memberCTE.id} is not null),
          '[]'::json
        )
      `.as('managers')
    })
    .from(periodTable)
    .leftJoin(table, eq(periodTable.id, table.managerialPeriodId))
    .leftJoin(memberCTE, eq(table.managerId, memberCTE.id))
    .groupBy(periodTable.id)
)

export type ManagerialPeriod = {
  id: string
  yearStart: number
  yearEnd: number
  managers: Array<Manager>
}

export const organizationManagerialSummaryCTE = qb
  .$with('organization_managerial_summary_cte')
  .as(
    qb
      .with(managerialPeriodCTE)
      .select({
        id: managerialPeriodCTE.organizationId,
        periods: sql<Array<ManagerialPeriod>>`
          coalesce(
            json_agg(
              json_build_object(
                'id', ${managerialPeriodCTE.id},
                'yearStart', ${managerialPeriodCTE.yearStart},
                'yearEnd', ${managerialPeriodCTE.yearEnd},
                'managers', ${managerialPeriodCTE.managers}
              )
              order by ${managerialPeriodCTE.yearStart} desc
            ),
            '[]'::json
          )
        `.as('periods')
      })
      .from(managerialPeriodCTE)
      .groupBy(managerialPeriodCTE.organizationId)
  )
