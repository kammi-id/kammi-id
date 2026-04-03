import { qb } from './common.cte'
import {
  training as table,
  trainingAttendants as attendantsTable,
  trainingInstructors as instructorsTable
} from '../../table/training.sql'
import { memberCTE, type Member } from './member.cte'
import {
  organizationWithHierarchyCTE,
  type OrganizationWithHierarchy
} from './organization.cte'
import { trainingSerialCTE } from './common.cte'
import { sql, eq, count, getColumns } from 'drizzle-orm'

const { organizerId, ...columns } = getColumns(table)

type MemberInTraining = Pick<
  Member,
  | 'id'
  | 'idNo'
  | 'name'
  | 'phone'
  | 'photo'
  | 'gender'
  | 'status'
  | 'registeredAt'
>

type TrainingAttendant = MemberInTraining &
  Pick<typeof attendantsTable.$inferSelect, 'isAdmitted' | 'isPassing'>

type TrainingInstructor = MemberInTraining &
  Pick<typeof instructorsTable.$inferSelect, 'role' | 'isIntern'>

const trainingAttendantsCTE = qb.$with('training_attendants_cte').as(
  qb
    .with(memberCTE)
    .select({
      id: attendantsTable.trainingId,
      attendants: sql<Array<TrainingAttendant>>`
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
              'registeredAt', ${memberCTE.registeredAt},
              'isAdmitted', ${attendantsTable.isAdmitted},
              'isPassing', ${attendantsTable.isPassing}
            )  
          ) filter (where ${memberCTE.id} is not null),
          '[]'::json
        )
      `.as('attendants'),
      attendantsCount: count(memberCTE.id).as('attendants_count')
    })
    .from(attendantsTable)
    .leftJoin(memberCTE, eq(attendantsTable.attendantId, memberCTE.id))
    .groupBy(attendantsTable.trainingId)
)

const trainingInstructorsCTE = qb.$with('training_instructors_cte').as(
  qb
    .with(memberCTE)
    .select({
      id: instructorsTable.trainingId,
      instructors: sql<Array<TrainingInstructor>>`
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
              'registeredAt', ${memberCTE.registeredAt},
              'role', ${instructorsTable.role},
              'isIntern', ${instructorsTable.isIntern}
            )  
          ) filter (where ${memberCTE.id} is not null),
          '[]'::json
        )
      `.as('instructors'),
      instructorsCount: count(memberCTE.id).as('instructors_count')
    })
    .from(instructorsTable)
    .leftJoin(memberCTE, eq(instructorsTable.instructorId, memberCTE.id))
    .groupBy(instructorsTable.trainingId)
)

export const trainingCTE = qb.$with('training_cte').as(
  qb
    .with(
      trainingSerialCTE,
      organizationWithHierarchyCTE,
      trainingAttendantsCTE,
      trainingInstructorsCTE
    )
    .select({
      ...columns,
      organizerId: table.organizerId,
      serial: trainingSerialCTE.serial,
      attendants: sql<Array<TrainingAttendant>>`
        coalesce(${trainingAttendantsCTE.attendants}, '[]'::json)
      `.as('attendants'),
      attendantsCount: sql<number>`
        coalesce(${trainingAttendantsCTE.attendantsCount}, 0)
      `.as('attendants_count'),
      instructors: sql<Array<TrainingInstructor>>`
        coalesce(${trainingInstructorsCTE.instructors}, '[]'::json)
      `.as('instructors'),
      instructorsCount: sql<number>`
        coalesce(${trainingInstructorsCTE.instructorsCount}, 0)
      `.as('instructors_count'),
      organizer: sql<
        Omit<OrganizationWithHierarchy, 'children' | 'childCount' | 'scopeId'>
      >`
          json_build_object(
            'id', ${organizationWithHierarchyCTE.id},
            'name', ${organizationWithHierarchyCTE.name},
            'slug', ${organizationWithHierarchyCTE.slug},
            'code', ${organizationWithHierarchyCTE.code},
            'codeSlug', ${organizationWithHierarchyCTE.codeSlug},
            'type', ${organizationWithHierarchyCTE.type},
            'level', ${organizationWithHierarchyCTE.level},
            'isActive', ${organizationWithHierarchyCTE.isActive},
            'logo', ${organizationWithHierarchyCTE.logo},
            'pd', ${organizationWithHierarchyCTE.pd},
            'pdln', ${organizationWithHierarchyCTE.pdln},
            'pw', ${organizationWithHierarchyCTE.pw}
          )
        `.as('organizer')
    })
    .from(table)
    .leftJoin(trainingSerialCTE, eq(table.id, trainingSerialCTE.id))
    .leftJoin(
      organizationWithHierarchyCTE,
      eq(table.organizerId, organizationWithHierarchyCTE.id)
    )
    .leftJoin(trainingAttendantsCTE, eq(table.id, trainingAttendantsCTE.id))
    .leftJoin(trainingInstructorsCTE, eq(table.id, trainingInstructorsCTE.id))
)

export type Training = Omit<
  typeof table.$inferSelect,
  'registrationUntil' | 'organizerId'
> & {
  serial: string
  attendants: Array<TrainingAttendant>
  attendantsCount: number
  instructors: Array<TrainingInstructor>
  instructorsCount: number
  organizer: Omit<
    OrganizationWithHierarchy,
    'children' | 'childCount' | 'scopeId'
  >
}
