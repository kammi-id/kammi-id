import { qb } from './common.cte'
import {
  member as table,
  memberEducation as educationTable,
  memberCareer as careerTable
} from '../../table/member.sql'
import {
  training as trainingTable,
  trainingAttendants as attendantsTable
} from '../../table/training.sql'
import { trainingSerialCTE } from './common.cte'
import {
  organizationWithHierarchyCTE,
  type OrganizationWithHierarchy
} from './organization.cte'
import { sql, eq, getColumns } from 'drizzle-orm'

const { registeredAtOrganizationId, ...columns } = getColumns(table)

export const memberStatusCTE = qb.$with('member_status_cte').as(
  qb
    .with(trainingSerialCTE)
    .select({
      id: table.id,
      trainings: sql<
        Array<
          Omit<typeof trainingTable.$inferSelect, 'registrationUntil'> &
            Pick<typeof attendantsTable.$inferSelect, 'isPassing'>
        >
      >`
        coalesce(
          json_agg(
            json_build_object(
              'id', ${trainingTable.id},
              'name', ${trainingTable.name},
              'type', ${trainingTable.type},
              'dateStart', ${trainingTable.dateStart},
              'dateEnd', ${trainingTable.dateEnd},
              'serial', ${trainingSerialCTE.serial},
              'isPassing', ${attendantsTable.isPassing}
            )
          ) filter (where ${trainingTable.id} is not null),
          '[]'::json
        )
      `.as('trainings'),
      status: sql<'ab3' | 'ab2' | 'ab1' | null>`
        case
          max(
            case
              when ${trainingTable.type} = 'dm3' and ${attendantsTable.isPassing} = true then 3
              when ${trainingTable.type} = 'dm2' and ${attendantsTable.isPassing} = true then 2
              when ${trainingTable.type} = 'dm1' and ${attendantsTable.isPassing} = true then 1
              else 0
            end
          )
            when 3 then 'ab3'
            when 2 then 'ab2'
            when 1 then 'ab1'
            else null
        end
      `.as('status'),
      isCertifiedMentor: sql<boolean>`
        case
          max(
            case
              when ${trainingTable.type} = 'dpmk' and ${attendantsTable.isPassing} = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
      `.as('is_certified_mentor'),
      isCertifiedInstructor: sql<boolean>`
        case
          max(
            case
              when ${trainingTable.type} = 'tfi' and ${attendantsTable.isPassing} = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
      `.as('is_certified_instructor')
    })
    .from(table)
    .leftJoin(attendantsTable, eq(table.id, attendantsTable.attendantId))
    .leftJoin(trainingTable, eq(attendantsTable.trainingId, trainingTable.id))
    .leftJoin(trainingSerialCTE, eq(trainingTable.id, trainingSerialCTE.id))
    .groupBy(table.id)
)

/**
 * Aggregates academic history for each member into a JSON array.
 * Includes institution details, major, and period of study.
 */
export const memberEducationCTE = qb.$with('member_education_cte').as(
  qb
    .select({
      memberId: educationTable.memberId,
      educations: sql<Array<typeof educationTable.$inferSelect>>`
        coalesce(
          json_agg(
            json_build_object(
              'type', ${educationTable.type},
              'institutionId', ${educationTable.institutionId},
              'institutionName', ${educationTable.institutionName},
              'major', ${educationTable.major},
              'yearStart', ${educationTable.yearStart},
              'yearEnd', ${educationTable.yearEnd}
            )
          ) filter (where ${educationTable.memberId} is not null),
          '[]'::json
        )
      `.as('educations')
    })
    .from(educationTable)
    .groupBy(educationTable.memberId)
)

/**
 * Aggregates professional history for each member into a JSON array.
 * Includes employer details, position, and period of employment.
 */
export const memberCareerCTE = qb.$with('member_career_cte').as(
  qb
    .select({
      memberId: careerTable.memberId,
      careers: sql<Array<typeof careerTable.$inferSelect>>`
        coalesce(
          json_agg(
            json_build_object(
              'type', ${careerTable.type},
              'employerId', ${careerTable.employerId},
              'employerName', ${careerTable.employerName},
              'position', ${careerTable.position},
              'yearStart', ${careerTable.yearStart},
              'yearEnd', ${careerTable.yearEnd}
            )
          ) filter (where ${careerTable.memberId} is not null),
          '[]'::json
        )
      `.as('careers')
    })
    .from(careerTable)
    .groupBy(careerTable.memberId)
)

/**
 * Main member CTE that assembles all member data, including status,
 * trainings, academic history, and professional history.
 */
export const memberCTE = qb.$with('member_cte').as(
  qb
    .with(
      memberStatusCTE,
      memberEducationCTE,
      memberCareerCTE,
      organizationWithHierarchyCTE
    )
    .select({
      ...columns,
      trainings: memberStatusCTE.trainings,
      status: memberStatusCTE.status,
      educations: memberEducationCTE.educations,
      careers: memberCareerCTE.careers,
      isCertifiedMentor: memberStatusCTE.isCertifiedMentor,
      isCertifiedInstructor: memberStatusCTE.isCertifiedInstructor,
      registeredAt: sql<
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
            'logo', ${organizationWithHierarchyCTE.logo},
            'isActive', ${organizationWithHierarchyCTE.isActive},
            'pd', ${organizationWithHierarchyCTE.pd},
            'pdln', ${organizationWithHierarchyCTE.pdln},
            'pw', ${organizationWithHierarchyCTE.pw}
          )
        `.as('registered_at'),
      organizationScopeId: organizationWithHierarchyCTE.scopeId
    })
    .from(table)
    .leftJoin(memberStatusCTE, eq(table.id, memberStatusCTE.id))
    .leftJoin(memberEducationCTE, eq(table.id, memberEducationCTE.memberId))
    .leftJoin(memberCareerCTE, eq(table.id, memberCareerCTE.memberId))
    .leftJoin(
      organizationWithHierarchyCTE,
      eq(table.registeredAtOrganizationId, organizationWithHierarchyCTE.id)
    )
)

/**
 * Comprehensive member profile data.
 * Merges core table columns with aggregated arrays for training and history.
 */
export type Member = Omit<
  typeof table.$inferSelect,
  'registeredAtOrganizationId'
> & {
  registeredAt: Omit<
    OrganizationWithHierarchy,
    'children' | 'childCount' | 'scopeId'
  >
  trainings: Array<
    Omit<typeof trainingTable.$inferSelect, 'registrationUntil'> &
      Pick<typeof attendantsTable.$inferSelect, 'isPassing'>
  >
  educations: Array<typeof educationTable.$inferSelect>
  careers: Array<typeof careerTable.$inferSelect>
  status: 'ab3' | 'ab2' | 'ab1' | null
  isCertifiedMentor: boolean
  isCertifiedInstructor: boolean
  organizationScopeId: Array<string>
}
