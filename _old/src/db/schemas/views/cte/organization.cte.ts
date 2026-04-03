import { alias } from 'drizzle-orm/pg-core'
import { qb } from './common.cte'
import { organization as table } from '../../table/organization.sql'
import { sql, count, eq, getColumns, type InferSelectModel } from 'drizzle-orm'

export type Organization = Omit<typeof table.$inferSelect, 'parentId'>

const organizationChildrenCTE = qb.$with('organization_children_cte').as(
  qb
    .select({
      id: table.parentId,
      children: sql<Array<Organization>>`
        coalesce(
          json_agg(
            json_build_object(
              'id', ${table.id},
              'name', ${table.name},
              'slug', ${table.slug},
              'code', ${table.code},
              'codeSlug', ${table.codeSlug},
              'type', ${table.type},
              'level', ${table.level},
              'logo', ${table.logo},
              'isActive', ${table.isActive}
            )
          ) filter (where ${table.id} is not null),
          '[]'::json
        )
      `.as('children'),
      childCount: count(table.id).as('child_count')
    })
    .from(table)
    .groupBy(table.parentId)
)

const parentTable = alias(table, 'parent')
const grandparentTable = alias(table, 'grandparent')

const { parentId, ...columns } = getColumns(table)

export const organizationWithHierarchyCTE = qb
  .$with('organization_with_hierarchy_cte')
  .as(
    qb
      .with(organizationChildrenCTE)
      .select({
        ...columns,
        children: sql<Array<Organization>>`
          coalesce(${organizationChildrenCTE.children}, '[]'::json)
        `.as('children'),
        childCount: sql<number>`
          coalesce(${organizationChildrenCTE.childCount}, 0)
        `.as('child_count'),
        pd: sql<Organization | null>`
          case
            when ${parentTable.type} = 'pd' then
              json_build_object(
                'id', ${parentTable.id},
                'name', ${parentTable.name},
                'slug', ${parentTable.slug},
                'code', ${parentTable.code},
                'codeSlug', ${parentTable.codeSlug},
                'type', ${parentTable.type},
                'level', ${parentTable.level},
                'logo', ${parentTable.logo},
                'isActive', ${parentTable.isActive}
              )
            else null
          end
        `.as('pd'),
        pdln: sql<Organization | null>`
          case
            when ${parentTable.type} = 'pdln' then
              json_build_object(
                'id', ${parentTable.id},
                'name', ${parentTable.name},
                'slug', ${parentTable.slug},
                'code', ${parentTable.code},
                'codeSlug', ${parentTable.codeSlug},
                'type', ${parentTable.type},
                'level', ${parentTable.level},
                'logo', ${parentTable.logo},
                'isActive', ${parentTable.isActive}
              )
            else null
          end
        `.as('pdln'),
        pw: sql<Organization | null>`
          case
            when ${parentTable.type} = 'pw' then
              json_build_object(
                'id', ${parentTable.id},
                'name', ${parentTable.name},
                'slug', ${parentTable.slug},
                'code', ${parentTable.code},
                'codeSlug', ${parentTable.codeSlug},
                'type', ${parentTable.type},
                'level', ${parentTable.level},
                'logo', ${parentTable.logo},
                'isActive', ${parentTable.isActive}
              )
            when ${grandparentTable.type} = 'pw' then
              json_build_object(
                'id', ${grandparentTable.id},
                'name', ${grandparentTable.name},
                'slug', ${grandparentTable.slug},
                'code', ${grandparentTable.code},
                'codeSlug', ${grandparentTable.codeSlug},
                'type', ${grandparentTable.type},
                'level', ${grandparentTable.level},
                'logo', ${grandparentTable.logo},
                'isActive', ${grandparentTable.isActive}
              )
            else null
          end
        `.as('pw'),
        scopeId: sql<Array<string>>`
          array_remove(
            array[
              ${table.id},
              ${parentTable.id},
              ${grandparentTable.id}
            ],
            null
          )
        `.as('scope_id')
      })
      .from(table)
      .leftJoin(
        organizationChildrenCTE,
        eq(table.id, organizationChildrenCTE.id)
      )
      .leftJoin(parentTable, eq(table.parentId, parentTable.id))
      .leftJoin(grandparentTable, eq(parentTable.parentId, grandparentTable.id))
  )

export type OrganizationWithHierarchy = Organization & {
  pd: Organization | null
  pdln: Organization | null
  pw: Organization | null
  children: Array<Organization>
  childCount: number
  scopeId: Array<string>
}
