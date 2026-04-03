import { pgTable, index, primaryKey } from 'drizzle-orm/pg-core'
import { organization } from './organization.sql'
import { member } from './member.sql'

export const managerialPeriod = pgTable(
  'managerial_period',
  (f) => ({
    id: f
      .uuid()
      .primaryKey()
      .$default(() => Bun.randomUUIDv7()),
    organizationId: f
      .uuid('organization_id')
      .notNull()
      .references(() => organization.id),
    yearStart: f.smallint('year_start').notNull(),
    yearEnd: f.smallint('year_end').notNull()
  }),
  (t) => [index('managerial_period_organization_id_idx').on(t.organizationId)]
)

export const manager = pgTable(
  'manager',
  (f) => ({
    managerialPeriodId: f
      .uuid('managerial_period_id')
      .notNull()
      .references(() => managerialPeriod.id),
    managerId: f
      .uuid('manager_id')
      .notNull()
      .references(() => member.id),
    role: f
      .text({
        enum: [
          'chief',
          'vice-chief',
          'secretary',
          'treasurer',
          'department-chief',
          'department-secretary',
          'department-treasurer',
          'sub-department-chief',
          'sub-department-secretary',
          'sub-department-treasurer',
          'staff',
          'intern'
        ]
      })
      .notNull(),
    roleTitle: f.text('role_title'),
    department: f.text(),
    subDepartment: f.text('sub_department'),
    isDailyManager: f.boolean()
  }),
  (t) => [
    primaryKey({
      columns: [t.managerialPeriodId, t.managerId]
    }),
    index('manager_managerial_period_id_idx').on(t.managerialPeriodId),
    index('manager_manager_id_idx').on(t.managerId)
  ]
)
