import { db } from '~/db/db'
import {
  eq,
  and,
  inArray,
  gte,
  sql,
  desc,
  ilike,
  or,
  notInArray,
  count,
  like
} from 'drizzle-orm'
import {
  training,
  trainingAttendants,
  trainingInstructors
} from '~/db/schema/training.sql'
import { organization } from '~/db/schema/organization.sql'
import { member } from '~/db/schema/member.sql'

export type TrainingType = 'dm1' | 'dm2' | 'dpmk' | 'tfi' | 'dm3' | 'other'

export type InstructorRole =
  | 'master'
  | 'assistant_master'
  | 'administrator'
  | 'classroom_master'
  | 'lecturer'
  | 'observer'
  | 'ustadz_of_training'

export type MemberTrainingRecord = {
  id: string
  name: string
  type: TrainingType
  year: number
  identifier: number
  startDate: string
  endDate: string
  organizationName: string | null
}

export type MemberTrainingHistory = {
  asAttendant: Array<MemberTrainingRecord & { isPassing: boolean }>
  asInstructor: Array<MemberTrainingRecord & { role: InstructorRole }>
}

export const readMemberTrainingHistory = async (
  memberId: string
): Promise<MemberTrainingHistory> => {
  const [attendantRows, instructorRows] = await Promise.all([
    db
      .select({
        id: training.id,
        name: training.name,
        type: training.type,
        year: training.year,
        identifier: training.identifier,
        startDate: training.startDate,
        endDate: training.endDate,
        isPassing: trainingAttendants.isPassing,
        organizationName: organization.name
      })
      .from(trainingAttendants)
      .innerJoin(training, eq(trainingAttendants.trainingId, training.id))
      .leftJoin(organization, eq(training.organizationId, organization.id))
      .where(eq(trainingAttendants.memberId, memberId))
      .orderBy(desc(training.startDate)),

    db
      .select({
        id: training.id,
        name: training.name,
        type: training.type,
        year: training.year,
        identifier: training.identifier,
        startDate: training.startDate,
        endDate: training.endDate,
        role: trainingInstructors.role,
        organizationName: organization.name
      })
      .from(trainingInstructors)
      .innerJoin(training, eq(trainingInstructors.trainingId, training.id))
      .leftJoin(organization, eq(training.organizationId, organization.id))
      .where(eq(trainingInstructors.memberId, memberId))
      .orderBy(desc(training.startDate))
  ])

  return {
    asAttendant: attendantRows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type as TrainingType,
      year: r.year!,
      identifier: r.identifier,
      startDate: r.startDate,
      endDate: r.endDate,
      isPassing: r.isPassing,
      organizationName: r.organizationName ?? null
    })),
    asInstructor: instructorRows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type as TrainingType,
      year: r.year!,
      identifier: r.identifier,
      startDate: r.startDate,
      endDate: r.endDate,
      role: r.role as InstructorRole,
      organizationName: r.organizationName ?? null
    }))
  }
}

export type TrainingFilters = {
  organizationId?: string
  year?: number
  search?: string
  types?: string[]
  page?: number
  pageSize?: number
}

export type UpcomingTraining = {
  id: string
  name: string
  startDate: string
  endDate: string
  registrationDeadline: string | null
  type: 'dm1' | 'dm2' | 'dpmk' | 'tfi' | 'dm3' | 'other'
  year: number
  identifier: number
  organization: {
    id: string
    name: string
    slug: string
    codeSlug: string
  }
}

export type TrainingCreateInput = Omit<
  typeof training.$inferInsert,
  'identifier'
> & { identifier?: number }
export type TrainingUpdateInput = Partial<typeof training.$inferInsert>

export const trainingQuery = {
  getAll: async (filters: TrainingFilters = {}) => {
    const { organizationId, year, search, types, page = 1, pageSize } = filters

    const where = [
      organizationId ? eq(training.organizationId, organizationId) : undefined,
      year ? eq(training.year, year) : undefined,
      search ? ilike(training.name, `%${search}%`) : undefined,
      types && types.length > 0
        ? inArray(training.type, types as any)
        : undefined
    ].filter(Boolean) as any[]

    const baseQuery = db
      .select({
        training: training,
        organization: organization
      })
      .from(training)
      .leftJoin(organization, eq(training.organizationId, organization.id))
      .where(and(...where))
      .orderBy(desc(training.startDate))

    const rows = pageSize
      ? await baseQuery.limit(pageSize).offset((page - 1) * pageSize)
      : await baseQuery

    const trainingIds = rows.map((r) => r.training.id)

    if (trainingIds.length === 0) {
      return { rows: [], totalCount: 0 }
    }

    // Attendant counts
    const attendantCounts = await db
      .select({ trainingId: trainingAttendants.trainingId, cnt: count() })
      .from(trainingAttendants)
      .where(inArray(trainingAttendants.trainingId, trainingIds))
      .groupBy(trainingAttendants.trainingId)

    const countMap = Object.fromEntries(
      attendantCounts.map((a) => [a.trainingId, a.cnt])
    )

    // Master names
    const masters = await db
      .select({
        trainingId: trainingInstructors.trainingId,
        memberName: member.name
      })
      .from(trainingInstructors)
      .leftJoin(member, eq(trainingInstructors.memberId, member.id))
      .where(
        and(
          inArray(trainingInstructors.trainingId, trainingIds),
          eq(trainingInstructors.role, 'master')
        )
      )

    const masterMap = Object.fromEntries(
      masters.map((m) => [m.trainingId, m.memberName])
    )

    // Total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(training)
      .leftJoin(organization, eq(training.organizationId, organization.id))
      .where(and(...where))

    return {
      rows: rows.map((row) => ({
        ...row.training,
        organization: row.organization,
        attendantCount: countMap[row.training.id] ?? 0,
        masterName: masterMap[row.training.id] ?? null
      })),
      totalCount: total
    }
  },

  getByIdentifier: async (orgId: string, fullIdentifier: string) => {
    const year = parseInt(fullIdentifier.slice(0, 4), 10)
    const identifier = parseInt(fullIdentifier.slice(4), 10)
    const [t] = await db
      .select()
      .from(training)
      .where(
        and(
          eq(training.organizationId, orgId),
          eq(training.year, year),
          eq(training.identifier, identifier)
        )
      )
      .limit(1)

    if (!t) return null

    const attendants = await db
      .select({
        attendant: trainingAttendants,
        member: member
      })
      .from(trainingAttendants)
      .leftJoin(member, eq(trainingAttendants.memberId, member.id))
      .where(eq(trainingAttendants.trainingId, t.id))

    const instructors = await db
      .select({
        instructor: trainingInstructors,
        member: member
      })
      .from(trainingInstructors)
      .leftJoin(member, eq(trainingInstructors.memberId, member.id))
      .where(eq(trainingInstructors.trainingId, t.id))

    return {
      ...t,
      attendants: attendants.map((a) => ({
        ...a.attendant,
        member: a.member
      })),
      instructors: instructors.map((i) => ({
        ...i.instructor,
        member: i.member
      }))
    }
  },

  getUpcoming: async (
    organizationIds?: string[],
    limit = 10
  ): Promise<UpcomingTraining[]> => {
    const today = new Date().toISOString().split('T')[0]

    const where = [
      gte(training.startDate, today),
      organizationIds && organizationIds.length > 0
        ? inArray(training.organizationId, organizationIds)
        : undefined
    ].filter(Boolean) as ReturnType<typeof gte>[]

    const rows = await db
      .select({
        id: training.id,
        name: training.name,
        startDate: training.startDate,
        endDate: training.endDate,
        registrationDeadline: training.registrationDeadline,
        type: training.type,
        year: training.year,
        identifier: training.identifier,
        orgId: organization.id,
        orgName: organization.name,
        orgSlug: organization.slug,
        orgCodeSlug: organization.codeSlug
      })
      .from(training)
      .leftJoin(organization, eq(training.organizationId, organization.id))
      .where(and(...where))
      .orderBy(training.startDate)
      .limit(limit)

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      startDate: row.startDate,
      endDate: row.endDate,
      registrationDeadline: row.registrationDeadline ?? null,
      type: row.type,
      year: row.year!,
      identifier: row.identifier,
      organization: {
        id: row.orgId!,
        name: row.orgName!,
        slug: row.orgSlug!,
        codeSlug: row.orgCodeSlug!
      }
    }))
  },

  create: async (data: TrainingCreateInput) => {
    const { identifier: _omitted, id: _id, ...fields } = data
    const year = new Date(fields.startDate).getFullYear()

    const [{ maxIdentifier }] = await db
      .select({
        maxIdentifier: sql<number>`COALESCE(MAX(${training.identifier}), 0)`
      })
      .from(training)
      .where(
        and(
          eq(training.organizationId, fields.organizationId),
          eq(training.year, year)
        )
      )

    const nextIdentifier = (maxIdentifier ?? 0) + 1

    const rows = await db.execute(sql`
      INSERT INTO training (organization_id, name, start_date, end_date, registration_deadline, type, identifier)
      VALUES (
        ${fields.organizationId},
        ${fields.name},
        ${fields.startDate},
        ${fields.endDate},
        ${fields.registrationDeadline ?? null},
        ${fields.type},
        ${nextIdentifier}
      )
      RETURNING *
    `)
    return (rows as any[])[0] as typeof training.$inferSelect
  },

  update: async (id: string, data: TrainingUpdateInput) => {
    const [updated] = await db
      .update(training)
      .set(data)
      .where(eq(training.id, id))
      .returning()
    return updated
  },

  delete: async (id: string) => {
    const [deleted] = await db
      .delete(training)
      .where(eq(training.id, id))
      .returning()
    return deleted
  },

  addAttendant: async (trainingId: string, memberId: string) => {
    const [inserted] = await db
      .insert(trainingAttendants)
      .values({
        trainingId,
        memberId
      })
      .returning()
    return inserted
  },

  updateAttendantStatus: async (
    trainingId: string,
    memberId: string,
    isPassing: boolean
  ) => {
    const [updated] = await db
      .update(trainingAttendants)
      .set({ isPassing })
      .where(
        and(
          eq(trainingAttendants.trainingId, trainingId),
          eq(trainingAttendants.memberId, memberId)
        )
      )
      .returning()
    return updated
  },

  removeAttendant: async (trainingId: string, memberId: string) => {
    const [deleted] = await db
      .delete(trainingAttendants)
      .where(
        and(
          eq(trainingAttendants.trainingId, trainingId),
          eq(trainingAttendants.memberId, memberId)
        )
      )
      .returning()
    return deleted
  },

  addInstructor: async (
    trainingId: string,
    memberId: string,
    role:
      | 'master'
      | 'assistant_master'
      | 'administrator'
      | 'classroom_master'
      | 'lecturer'
      | 'observer'
      | 'ustadz_of_training'
  ) => {
    const [inserted] = await db
      .insert(trainingInstructors)
      .values({
        trainingId,
        memberId,
        role
      })
      .returning()
    return inserted
  },

  removeInstructor: async (trainingId: string, memberId: string) => {
    const [deleted] = await db
      .delete(trainingInstructors)
      .where(
        and(
          eq(trainingInstructors.trainingId, trainingId),
          eq(trainingInstructors.memberId, memberId)
        )
      )
      .returning()
    return deleted
  }
}

export type EligibleMember = {
  id: string
  name: string
  registerNumber: string
  status: 'ab1' | 'ab2' | 'ab3'
  isCertifiedMentor: boolean
  isCertifiedInstructor: boolean
  pw: string | null
}

const pwNameSubquery = sql<string | null>`(
  WITH RECURSIVE anc AS (
    SELECT id, name, type, parent_id FROM organization WHERE id = ${member.organizationId}
    UNION ALL
    SELECT org.id, org.name, org.type, org.parent_id
    FROM organization org JOIN anc ON org.id = anc.parent_id
  )
  SELECT name FROM anc WHERE type = 'pw' LIMIT 1
)`

export const searchEligibleAttendants = async (
  trainingId: string,
  trainingType: TrainingType,
  query: string
): Promise<EligibleMember[]> => {
  const baseFilters = [
    eq(member.isSuspended, false),
    eq(member.isNonActive, false),
    or(
      ilike(member.name, `%${query}%`),
      ilike(member.registerNumber, `%${query}%`)
    )
  ]

  const typeFilter = (() => {
    switch (trainingType) {
      case 'dm1':
        return []
      case 'dm2':
        return [eq(member.status, 'ab1')]
      case 'dm3':
        return [eq(member.status, 'ab2'), eq(member.isCertifiedMentor, true)]
      case 'dpmk':
        return [eq(member.status, 'ab2'), eq(member.isCertifiedMentor, false)]
      case 'tfi':
        return [
          sql`${member.status} IN ('ab2', 'ab3')`,
          eq(member.isCertifiedInstructor, false)
        ]
      default:
        return []
    }
  })()

  // Exclude members already registered
  const existingAttendants = await db
    .select({ memberId: trainingAttendants.memberId })
    .from(trainingAttendants)
    .where(eq(trainingAttendants.trainingId, trainingId))

  const existingIds = existingAttendants.map((a) => a.memberId)
  const excludeFilter =
    existingIds.length > 0 ? [notInArray(member.id, existingIds)] : []

  const results = await db
    .select({
      id: member.id,
      name: member.name,
      registerNumber: member.registerNumber,
      status: member.status,
      isCertifiedMentor: member.isCertifiedMentor,
      isCertifiedInstructor: member.isCertifiedInstructor,
      pw: pwNameSubquery
    })
    .from(member)
    .where(and(...baseFilters, ...typeFilter, ...excludeFilter))
    .limit(10)

  return results as EligibleMember[]
}

export const searchEligibleInstructorsGlobal = async (
  query: string
): Promise<EligibleMember[]> => {
  const results = await db
    .select({
      id: member.id,
      name: member.name,
      registerNumber: member.registerNumber,
      status: member.status,
      isCertifiedMentor: member.isCertifiedMentor,
      isCertifiedInstructor: member.isCertifiedInstructor,
      pw: pwNameSubquery
    })
    .from(member)
    .where(
      and(
        eq(member.status, 'ab3'),
        eq(member.isCertifiedInstructor, true),
        eq(member.isSuspended, false),
        eq(member.isNonActive, false),
        or(
          ilike(member.name, `%${query}%`),
          ilike(member.registerNumber, `%${query}%`)
        )
      )
    )
    .limit(10)

  return results as EligibleMember[]
}

export const searchEligibleInstructors = async (
  trainingId: string,
  query: string
): Promise<EligibleMember[]> => {
  const existingInstructors = await db
    .select({ memberId: trainingInstructors.memberId })
    .from(trainingInstructors)
    .where(eq(trainingInstructors.trainingId, trainingId))

  const existingIds = existingInstructors.map((i) => i.memberId)
  const excludeFilter =
    existingIds.length > 0 ? [notInArray(member.id, existingIds)] : []

  const results = await db
    .select({
      id: member.id,
      name: member.name,
      registerNumber: member.registerNumber,
      status: member.status,
      isCertifiedMentor: member.isCertifiedMentor,
      isCertifiedInstructor: member.isCertifiedInstructor,
      pw: pwNameSubquery
    })
    .from(member)
    .where(
      and(
        eq(member.status, 'ab3'),
        eq(member.isCertifiedInstructor, true),
        eq(member.isSuspended, false),
        eq(member.isNonActive, false),
        or(
          ilike(member.name, `%${query}%`),
          ilike(member.registerNumber, `%${query}%`)
        ),
        ...excludeFilter
      )
    )
    .limit(10)

  return results as EligibleMember[]
}
