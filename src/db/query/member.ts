import { db } from '../db'
import { member } from '../schema/member.sql'
import { withMemberCTE, type Member } from './cte/member'
export { withMemberCTE, type Member }
import {
  inArray,
  eq,
  and,
  ilike,
  sql,
  desc,
  isNull,
  type SQL
} from 'drizzle-orm'
import { type DBExecutor } from '../types'
import { user as userTable } from '../schema/user.sql'

import { createUser } from './user'
import { generatePassword, hashPassword } from '~/lib/utils/user'
import { organization } from '../schema/organization.sql'
import { fetchAllowedOrgIds } from './organization'

type MemberInsertValues = typeof member.$inferInsert
export type MemberFilters = {
  id?: string[]
  name?: string
  registerNumber?: string
  phone?: string
  organizationId?: string[]
  provinceCode?: string[]
  cityCode?: string[]
  isAlumn?: boolean
  isSuspended?: boolean
  isNonActive?: boolean
  status?: ('ab1' | 'ab2' | 'ab3')[]
  gender?: 'ikhwan' | 'akhwat'
  isCertifiedMentor?: boolean
  isCertifiedInstructor?: boolean
  sort?: string
  order?: 'asc' | 'desc'
}

export type MemberAggregatesFilters = {
  organizationId?: string
  isCertifiedMentor?: boolean
  isCertifiedInstructor?: boolean
  isAlumn?: boolean
}

export type MemberAggregatesResult = {
  organizationId: string
  parentId: string | null
  level: number
  ab1: number
  ab2: number
  ab3: number
  ikhwan: number
  akhwat: number
  total: number
}

type MemberAggregatesRow = {
  organizationId: string
  parentId: string | null
  level: number
  ab1: number | null
  ab2: number | null
  ab3: number | null
  ikhwan: number | null
  akhwat: number | null
  total: number | null
}

export const readMemberAggregates = async (
  filters: MemberAggregatesFilters & {
    user?: { role: string; connectedOrganizationId: string | null }
  } = {}
): Promise<Array<MemberAggregatesResult>> => {
  const {
    organizationId,
    isCertifiedMentor,
    isCertifiedInstructor,
    isAlumn,
    user
  } = filters

  let allowedOrgIds: string[] = []
  if (user) {
    const allowedRoles = ['root', 'bph', 'bpk']
    if (!allowedRoles.includes(user.role)) {
      return []
    }

    allowedOrgIds = await fetchAllowedOrgIds(user)
    if (allowedOrgIds.length === 0) return []
  }

  // Determine the single anchor org for the recursive CTE.
  // When organizationId is given, we expand from that org downward.
  // When user-scoped (no organizationId), we find the top of the user's
  // connected subtree (their connectedOrganizationId, or the PP root for root/bph).
  // We NEVER use multiple anchors — that's what caused double-counting before.
  let anchorId: string | null = organizationId || null

  if (!anchorId && user) {
    const connectedOrgId =
      user.connectedOrganizationId ??
      (await db
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.type, 'pp' as any))
        .limit(1)
        .then((r) => r[0]?.id ?? null))
    anchorId = connectedOrgId
  }

  if (!anchorId) return []

  // 1. Recursive CTE starting from a single anchor, expanding the entire subtree.
  //    Each org appears exactly once.  We then LEFT JOIN member to get direct counts.
  const directRows = await db
    .execute(
      sql`
    WITH RECURSIVE org_tree AS (
      SELECT id, parent_id,
             CASE
               WHEN type = 'pp' THEN 1
               WHEN type = 'pw' THEN 2
               WHEN type IN ('pd', 'pdln') THEN 3
               WHEN type = 'pk' THEN 4
               ELSE 5
             END AS level
      FROM organization
      WHERE id = ${anchorId}
      UNION ALL
      SELECT o.id, o.parent_id,
             CASE
               WHEN o.type = 'pp' THEN 1
               WHEN o.type = 'pw' THEN 2
               WHEN o.type IN ('pd', 'pdln') THEN 3
               WHEN o.type = 'pk' THEN 4
               ELSE 5
             END AS level
      FROM organization o
      JOIN org_tree ot ON o.parent_id = ot.id
    )
    SELECT
      ot.id AS "organizationId",
      ot.parent_id AS "parentId",
      ot.level AS "level",
      count(*) FILTER (WHERE m.status = 'ab1')::int AS "ab1",
      count(*) FILTER (WHERE m.status = 'ab2')::int AS "ab2",
      count(*) FILTER (WHERE m.status = 'ab3')::int AS "ab3",
      count(*) FILTER (WHERE m.gender = 'ikhwan')::int AS "ikhwan",
      count(*) FILTER (WHERE m.gender = 'akhwat')::int AS "akhwat",
      count(m.id)::int AS "total"
    FROM org_tree ot
    LEFT JOIN member m ON m.organization_id = ot.id
      ${isAlumn !== undefined ? sql`AND m.is_alumn = ${isAlumn}` : sql``}
      ${isCertifiedMentor !== undefined ? sql`AND m.is_certified_mentor = ${isCertifiedMentor}` : sql``}
      ${isCertifiedInstructor !== undefined ? sql`AND m.is_certified_instructor = ${isCertifiedInstructor}` : sql``}
      ${isAlumn === false ? sql`AND m.is_non_active = false` : sql``}
      AND m.is_suspended = false
    ${
      allowedOrgIds.length > 0
        ? sql`WHERE ot.id IN (${sql.join(
            allowedOrgIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        : sql``
    }
    GROUP BY ot.id, ot.parent_id, ot.level
  `
    )
    .then((res) => {
      const rows = res as unknown as MemberAggregatesRow[]
      return rows.map((row) => ({
        organizationId: row.organizationId,
        parentId: row.parentId,
        level: row.level,
        ab1: row.ab1 || 0,
        ab2: row.ab2 || 0,
        ab3: row.ab3 || 0,
        ikhwan: row.ikhwan || 0,
        akhwat: row.akhwat || 0,
        total: row.total || 0
      }))
    })

  // 2. Bottom-up aggregation in TypeScript.
  //    Each org starts with only its direct member counts (from the JOIN above).
  //    Then we roll up children into parents, deepest-first.
  //    Because the CTE has a single anchor, every org appears exactly once — no
  //    double-counting is possible.
  const accumulated: Record<string, MemberAggregatesResult> = {}

  for (const row of directRows) {
    accumulated[row.organizationId] = { ...row }
  }

  const sortedOrgs = [...directRows].sort((a, b) => b.level - a.level)

  for (const org of sortedOrgs) {
    const current = accumulated[org.organizationId]
    const parentId = org.parentId

    if (parentId && accumulated[parentId]) {
      const parent = accumulated[parentId]
      parent.ab1 += current.ab1
      parent.ab2 += current.ab2
      parent.ab3 += current.ab3
      parent.ikhwan += current.ikhwan
      parent.akhwat += current.akhwat
      parent.total += current.total
    }
  }

  return Object.values(accumulated)
}

export const createMember = async (
  values: MemberInsertValues,
  tx?: DBExecutor
): Promise<Array<Member>> => {
  const execute = async (t: DBExecutor) => {
    const [newMember] = await t.insert(member).values(values).returning({
      id: member.id,
      name: member.name,
      registerNumber: member.registerNumber
    })

    const password = generatePassword()
    const passwordHash = await hashPassword(password)

    await createUser(
      {
        name: newMember.registerNumber,
        displayName: newMember.name,
        passwordHash,
        role: 'member',
        connectedMemberId: newMember.id
      },
      t
    )

    return await t
      .with(withMemberCTE)
      .select()
      .from(withMemberCTE)
      .where(eq(withMemberCTE.id, newMember.id))
  }

  if (tx) return await execute(tx)
  return await db.transaction(async (t) => await execute(t))
}

export const readMember = async (
  filters: MemberFilters & {
    limit?: number
    offset?: number
    user?: { role: string; connectedOrganizationId: string | null }
  } = {}
): Promise<Array<Member>> => {
  const { limit, offset, user, ...memberFilters } = filters
  const where: SQL[] = []

  if (user) {
    const allowedRoles = ['root', 'bph', 'bpk']
    if (!allowedRoles.includes(user.role)) {
      return []
    }

    const allowedIds = await fetchAllowedOrgIds(user)
    if (allowedIds.length === 0) {
      return []
    }
    where.push(inArray(withMemberCTE.organizationId, allowedIds))
  }

  if (memberFilters.id) where.push(inArray(withMemberCTE.id, memberFilters.id))
  if (memberFilters.name)
    where.push(ilike(withMemberCTE.name, `%${memberFilters.name}%`))
  if (memberFilters.registerNumber)
    where.push(
      ilike(withMemberCTE.registerNumber, `%${memberFilters.registerNumber}%`)
    )
  if (memberFilters.phone)
    where.push(ilike(withMemberCTE.phone, `%${memberFilters.phone}%`))
  if (memberFilters.organizationId)
    where.push(
      inArray(withMemberCTE.organizationId, memberFilters.organizationId)
    )
  if (memberFilters.provinceCode)
    where.push(
      inArray(withMemberCTE.addressProvinceCode, memberFilters.provinceCode)
    )
  if (memberFilters.cityCode)
    where.push(inArray(withMemberCTE.addressCityCode, memberFilters.cityCode))
  if (memberFilters.isAlumn !== undefined)
    where.push(eq(withMemberCTE.isAlumn, memberFilters.isAlumn))
  if (filters.isSuspended !== undefined)
    where.push(eq(withMemberCTE.isSuspended, filters.isSuspended))
  if (filters.isNonActive !== undefined)
    where.push(eq(withMemberCTE.isNonActive, filters.isNonActive))
  if (memberFilters.status)
    where.push(inArray(withMemberCTE.status, memberFilters.status))
  if (memberFilters.gender)
    where.push(eq(withMemberCTE.gender, memberFilters.gender))
  where.push(isNull(withMemberCTE.deletedAt))

  const sortMapping: Record<string, string> = {
    name: 'm.name',
    yearOfEntry: 'm.year_of_entry',
    registerNumber: 'm.register_number',
    phone: 'm.phone'
  }

  const sortCol = sortMapping[memberFilters.sort || ''] || 'm.year_of_entry'
  const sortDir = memberFilters.order === 'asc' ? 'ASC' : 'DESC'

  const query = db
    .with(withMemberCTE)
    .select()
    .from(withMemberCTE)
    .where(and(...where))
    .orderBy(sql.raw(`${sortCol} ${sortDir}`), sql`m.name ASC`)

  if (limit !== undefined) query.limit(limit)
  if (offset !== undefined) query.offset(offset)

  return await query
}

export const readMemberByRegisterNumber = async (
  registerNumber: string
): Promise<Member | null> => {
  const [found] = await db
    .with(withMemberCTE)
    .select()
    .from(withMemberCTE)
    .where(
      and(
        eq(withMemberCTE.registerNumber, registerNumber),
        isNull(withMemberCTE.deletedAt)
      )
    )
    .limit(1)
  return found ?? null
}

export const deleteMember = async (id: string): Promise<void> => {
  await db.transaction(async (tx) => {
    await tx
      .update(member)
      .set({ deletedAt: new Date() })
      .where(eq(member.id, id))

    await tx.delete(userTable).where(eq(userTable.connectedMemberId, id))
  })
}

export const updateMember = async (
  values: Partial<MemberInsertValues>,
  id: string
): Promise<Array<Member>> => {
  return await db.transaction(async (tx) => {
    await tx.update(member).set(values).where(eq(member.id, id))

    return await tx
      .with(withMemberCTE)
      .select()
      .from(withMemberCTE)
      .where(eq(withMemberCTE.id, id))
  })
}

type OrgRef = {
  id: string
  name: string
  slug: string
} | null

type MemberDescendantRow = {
  id: string
  name: string
  phone: string | null
  registerNumber: string | null
  organizationId: string
  isAlumn: boolean
  isSuspended: boolean
  isNonActive: boolean
  isCertifiedMentor: boolean
  isCertifiedInstructor: boolean
  addressProvince: string | null
  addressCity: string | null
  addressDistrict: string | null
  addressSubdistrict: string | null
  addressProvinceCode: string | null
  addressCityCode: string | null
  addressDistrictCode: string | null
  addressSubdistrictCode: string | null
  addressLine: string | null
  photo: string | null
  status: string
  gender: string
  yearOfEntry: number | null
  organization: {
    id: string
    name: string
    slug: string
  }
  orgHierarchy: {
    pk: OrgRef
    pd: OrgRef
    pw: OrgRef
  } | null
}

export const readDescendantMembers = async (
  parentId: string,
  filters: MemberFilters & {
    limit?: number
    offset?: number
    user?: { role: string; connectedOrganizationId: string | null }
  } = {}
): Promise<[Member[], number]> => {
  const { limit = 10, offset = 0, user, ...memberFilters } = filters

  if (user) {
    const allowedIds = await fetchAllowedOrgIds(user)
    if (allowedIds.length === 0) {
      return [[], 0]
    }
    // We need to make sure the requested parentId is also in the allowed list,
    // or the user is root. Root is handled by fetchAllowedOrgIds returning all.
    // But for specific subtree queries, the user must have access to the root of that subtree.
    if (!allowedIds.includes(parentId)) {
      return [[], 0]
    }
  }

  const { name, status, gender } = memberFilters

  const sortMapping: Record<string, string> = {
    name: 'm.name',
    yearOfEntry: 'm.year_of_entry',
    registerNumber: 'm.register_number',
    phone: 'm.phone'
  }

  const sortCol = sortMapping[memberFilters.sort || ''] || 'm.year_of_entry'
  const sortDir = memberFilters.order === 'asc' ? 'ASC' : 'DESC'

  // 1. Fetch Members
  const data = await db
    .execute(
      sql`
    WITH RECURSIVE org_tree AS (
      SELECT id FROM organization WHERE id = ${parentId}
      UNION ALL
      SELECT o.id FROM organization o JOIN org_tree ot ON o.parent_id = ot.id
    )
    SELECT
      m.id, m.name, m.phone, m.register_number as "registerNumber",
      m.organization_id as "organizationId", m.is_alumn as "isAlumn",
      m.is_suspended as "isSuspended", m.is_non_active as "isNonActive",
      m.is_certified_mentor as "isCertifiedMentor",
      m.is_certified_instructor as "isCertifiedInstructor",
      m.address_province as "addressProvince",
      m.address_city as "addressCity",
      m.address_district as "addressDistrict",
      m.address_subdistrict as "addressSubdistrict",
      m.address_province_code as "addressProvinceCode",
      m.address_city_code as "addressCityCode",
      m.address_district_code as "addressDistrictCode",
      m.address_subdistrict_code as "addressSubdistrictCode",
      m.address_line as "addressLine",
      m.photo,
      m.status, m.gender, m.year_of_entry as "yearOfEntry",
      json_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug
      ) as "organization",
      json_build_object(
        'pk', (
          WITH RECURSIVE anc AS (
            SELECT id, name, slug, type, parent_id FROM organization WHERE id = o.id
            UNION ALL
            SELECT org.id, org.name, org.slug, org.type, org.parent_id
            FROM organization org JOIN anc ON org.id = anc.parent_id
          )
          SELECT json_build_object('id', id, 'name', name, 'slug', slug)
          FROM anc WHERE type = 'pk' LIMIT 1
        ),
        'pd', (
          WITH RECURSIVE anc AS (
            SELECT id, name, slug, type, parent_id FROM organization WHERE id = o.id
            UNION ALL
            SELECT org.id, org.name, org.slug, org.type, org.parent_id
            FROM organization org JOIN anc ON org.id = anc.parent_id
          )
          SELECT json_build_object('id', id, 'name', name, 'slug', slug)
          FROM anc WHERE type IN ('pd', 'pdln') LIMIT 1
        ),
        'pw', (
          WITH RECURSIVE anc AS (
            SELECT id, name, slug, type, parent_id FROM organization WHERE id = o.id
            UNION ALL
            SELECT org.id, org.name, org.slug, org.type, org.parent_id
            FROM organization org JOIN anc ON org.id = anc.parent_id
          )
          SELECT json_build_object('id', id, 'name', name, 'slug', slug)
          FROM anc WHERE type = 'pw' LIMIT 1
        )
      ) as "orgHierarchy"
    FROM member m
    JOIN organization o ON m.organization_id = o.id
    WHERE m.organization_id IN (SELECT id FROM org_tree)
      AND m.deleted_at IS NULL
      ${filters.user ? sql`AND m.organization_id IN ${await fetchAllowedOrgIds(filters.user)}` : sql``}
      ${filters.isAlumn !== undefined ? sql`AND m.is_alumn = ${filters.isAlumn}` : sql``}
      ${filters.isCertifiedMentor !== undefined ? sql`AND m.is_certified_mentor = ${filters.isCertifiedMentor}` : sql``}
      ${filters.isCertifiedInstructor !== undefined ? sql`AND m.is_certified_instructor = ${filters.isCertifiedInstructor}` : sql``}
      ${filters.isAlumn === false ? sql`AND m.is_non_active = false` : sql``}
      ${sql`AND m.is_suspended = false`}
    ${name ? sql`AND m.name ILIKE ${'%' + name + '%'}` : sql``}
    ${status ? sql`AND m.status IN ${status}` : sql``}
    ${gender ? sql`AND m.gender = ${gender}` : sql``}
    ORDER BY ${sql.raw(sortCol)} ${sql.raw(sortDir)}, m.name ASC
    LIMIT ${limit} OFFSET ${offset}
  `
    )
    .then((res) => {
      const rows = res as unknown as MemberDescendantRow[]
      return rows.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        registerNumber: row.registerNumber as string,
        organizationId: row.organizationId,
        isAlumn: row.isAlumn,
        isSuspended: row.isSuspended,
        isNonActive: row.isNonActive,
        isCertifiedMentor: row.isCertifiedMentor,
        isCertifiedInstructor: row.isCertifiedInstructor,
        addressProvince: row.addressProvince,
        addressCity: row.addressCity,
        addressDistrict: row.addressDistrict,
        addressSubdistrict: row.addressSubdistrict,
        addressProvinceCode: row.addressProvinceCode,
        addressCityCode: row.addressCityCode,
        addressDistrictCode: row.addressDistrictCode,
        addressSubdistrictCode: row.addressSubdistrictCode,
        addressLine: row.addressLine,
        photo: row.photo,
        status: row.status as 'ab1' | 'ab2' | 'ab3',
        gender: row.gender as 'ikhwan' | 'akhwat',
        yearOfEntry: row.yearOfEntry as number,
        organization: row.organization as any,
        orgHierarchy: row.orgHierarchy as {
          pk: OrgRef
          pd: OrgRef
          pw: OrgRef
        } | null,
        deletedAt: null
      }))
    })

  // 2. Fetch Total Count
  const countResult = await db
    .execute(
      sql`
    WITH RECURSIVE org_tree AS (
      SELECT id FROM organization WHERE id = ${parentId}
      UNION ALL
      SELECT o.id FROM organization o JOIN org_tree ot ON o.parent_id = ot.id
    )
    SELECT count(*)::int as count
    FROM member m
    WHERE m.organization_id IN (SELECT id FROM org_tree)
      AND m.deleted_at IS NULL
      ${filters.user ? sql`AND m.organization_id IN ${await fetchAllowedOrgIds(filters.user)}` : sql``}
      ${filters.isAlumn !== undefined ? sql`AND m.is_alumn = ${filters.isAlumn}` : sql``}
      ${filters.isCertifiedMentor !== undefined ? sql`AND m.is_certified_mentor = ${filters.isCertifiedMentor}` : sql``}
      ${filters.isCertifiedInstructor !== undefined ? sql`AND m.is_certified_instructor = ${filters.isCertifiedInstructor}` : sql``}
      ${filters.isAlumn === false ? sql`AND m.is_non_active = false` : sql``}
      ${sql`AND m.is_suspended = false`}
    ${name ? sql`AND m.name ILIKE ${'%' + name + '%'}` : sql``}
    ${status ? sql`AND m.status IN ${status}` : sql``}
    ${gender ? sql`AND m.gender = ${gender}` : sql``}
  `
    )
    .then((res) => {
      const row = res[0]
      return row && typeof row === 'object' && 'count' in row
        ? { count: Number(row.count) }
        : { count: 0 }
    })

  return [data, countResult?.count ?? 0]
}

export type MemberYearDistributionResult = {
  year: number
  count: number
}

export const readMemberYearDistribution = async (
  organizationIds?: string[]
): Promise<MemberYearDistributionResult[]> => {
  const conditions = [
    eq(member.isAlumn, false),
    eq(member.isSuspended, false),
    eq(member.isNonActive, false),
    ...(organizationIds?.length
      ? [inArray(member.organizationId, organizationIds)]
      : [])
  ]

  const results = await db
    .select({
      year: member.yearOfEntry,
      count: sql<number>`count(*)::int`
    })
    .from(member)
    .where(and(...conditions))
    .groupBy(member.yearOfEntry)
    .orderBy(member.yearOfEntry)

  return results.map((row) => ({
    year: row.year,
    count: Number(row.count)
  }))
}

export type MemberOrgDistributionResult = {
  organizationId: string
  organizationName: string
  total: number
  ikhwan: number
  akhwat: number
  ab1: number
  ab2: number
  ab3: number
}

export const readMemberDistributionByOrgType = async (
  orgType: 'pw' | 'pd' | 'pdln' | 'pk',
  allowedOrgIds: string[]
): Promise<MemberOrgDistributionResult[]> => {
  if (allowedOrgIds.length === 0) return []

  // Recursive CTE: for each org of the target type, expand its entire subtree
  // so members in child orgs (PD, PK under a PW) are counted toward the parent.
  const results = await db.execute(sql`
    WITH RECURSIVE subtree AS (
      SELECT id, id AS root_id
      FROM organization
      WHERE type = ${orgType}
        AND id IN (${sql.join(
          allowedOrgIds.map((id) => sql`${id}`),
          sql`, `
        )})
      UNION ALL
      SELECT o.id, s.root_id
      FROM organization o
      JOIN subtree s ON o.parent_id = s.id
    )
    SELECT
      root_org.id as "organizationId",
      root_org.name as "organizationName",
      count(*) FILTER (WHERE m.status = 'ab1')::int as "ab1",
      count(*) FILTER (WHERE m.status = 'ab2')::int as "ab2",
      count(*) FILTER (WHERE m.status = 'ab3')::int as "ab3",
      count(*) FILTER (WHERE m.gender = 'ikhwan')::int as "ikhwan",
      count(*) FILTER (WHERE m.gender = 'akhwat')::int as "akhwat",
      count(m.id)::int as "total"
    FROM subtree s
    JOIN organization root_org ON root_org.id = s.root_id
    LEFT JOIN member m ON m.organization_id = s.id
      AND m.is_alumn = false
      AND m.is_suspended = false
      AND m.is_non_active = false
    GROUP BY root_org.id, root_org.name
    HAVING count(m.id) > 0
    ORDER BY count(m.id) DESC
  `)

  return (
    results as unknown as Array<{
      organizationId: string
      organizationName: string
      ab1: number | null
      ab2: number | null
      ab3: number | null
      ikhwan: number | null
      akhwat: number | null
      total: number | null
    }>
  ).map((row) => ({
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    ab1: row.ab1 || 0,
    ab2: row.ab2 || 0,
    ab3: row.ab3 || 0,
    ikhwan: row.ikhwan || 0,
    akhwat: row.akhwat || 0,
    total: row.total || 0
  }))
}
