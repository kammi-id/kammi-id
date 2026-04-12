import { db } from '../../db'
import { organization } from '../../schema/organization.sql'
import { getColumns } from 'drizzle-orm'

export const withOrganizationCTE = db
  .$with('with_organization_cte')
  .as(db.select({ ...getColumns(organization) }).from(organization))

export type Organization = typeof organization.$inferSelect
