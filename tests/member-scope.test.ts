import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { member } from '~/db/schema/member.sql'
import { readDescendantMembers, readMemberAggregates } from '~/db/query/member'

// A page that resolves its Struktur from a URL slug hands the resolved org id
// straight to these reads. These tests fire the way that exploit does: an
// account scoped to one PK asking for a sibling PK it does not own.

const suffix = Date.now().toString(36)

const insertOrg = async (values: {
  name: string
  type: 'pp' | 'pw' | 'pd' | 'pk'
  parentId: string | null
}) => {
  const [row] = await db
    .insert(organization)
    .values({
      name: values.name,
      slug: `${values.name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
      code: `${values.name.toUpperCase().replace(/\s+/g, '-')}-${suffix}`,
      type: values.type,
      parentId: values.parentId,
      isNonActive: false
    })
    .returning({ id: organization.id })
  return row.id
}

describe('Cakupan on member reads', () => {
  let ppId: string
  let pwId: string
  let pdId: string
  let pkItbId: string
  let pkUnpadId: string
  const orgIds: string[] = []
  const memberIds: string[] = []

  const bpkAtItb = () => ({ role: 'bpk', connectedOrganizationId: pkItbId })
  const root = { role: 'root', connectedOrganizationId: null }

  beforeAll(async () => {
    ppId = await insertOrg({
      name: `PP Scope ${suffix}`,
      type: 'pp',
      parentId: null
    })
    pwId = await insertOrg({
      name: `PW Scope ${suffix}`,
      type: 'pw',
      parentId: ppId
    })
    pdId = await insertOrg({
      name: `PD Scope ${suffix}`,
      type: 'pd',
      parentId: pwId
    })
    pkItbId = await insertOrg({
      name: `PK ITB ${suffix}`,
      type: 'pk',
      parentId: pdId
    })
    pkUnpadId = await insertOrg({
      name: `PK UNPAD ${suffix}`,
      type: 'pk',
      parentId: pdId
    })
    orgIds.push(pkItbId, pkUnpadId, pdId, pwId, ppId)

    const rows = await db
      .insert(member)
      .values([
        {
          name: `Kader ITB ${suffix}`,
          registerNumber: `ITB-${suffix}`,
          organizationId: pkItbId,
          status: 'ab1' as const,
          gender: 'ikhwan' as const,
          yearOfEntry: 2024
        },
        {
          name: `Kader UNPAD ${suffix}`,
          registerNumber: `UNPAD-${suffix}`,
          organizationId: pkUnpadId,
          status: 'ab1' as const,
          gender: 'akhwat' as const,
          yearOfEntry: 2024
        }
      ])
      .returning({ id: member.id })
    memberIds.push(...rows.map((r) => r.id))
  })

  afterAll(async () => {
    if (memberIds.length) {
      await db.delete(member).where(inArray(member.id, memberIds))
    }
    // Children first — parent_id is a foreign key.
    for (const id of orgIds) {
      await db.delete(organization).where(eq(organization.id, id))
    }
  })

  it('returns nothing when a BPK account targets a Struktur outside its Cakupan', async () => {
    const [members, total] = await readDescendantMembers(pkUnpadId, {
      user: bpkAtItb()
    })

    expect(members).toEqual([])
    expect(total).toBe(0)
  })

  it('still returns a BPK account its own Struktur', async () => {
    const [members, total] = await readDescendantMembers(pkItbId, {
      user: bpkAtItb()
    })

    expect(total).toBe(1)
    expect(members[0].registerNumber).toBe(`ITB-${suffix}`)
  })

  it('lets Root read any Struktur', async () => {
    const [members, total] = await readDescendantMembers(pkUnpadId, {
      user: root
    })

    expect(total).toBe(1)
    expect(members[0].registerNumber).toBe(`UNPAD-${suffix}`)
  })

  it('gives a BPK account no aggregates for a Struktur outside its Cakupan', async () => {
    const rows = await readMemberAggregates({
      user: bpkAtItb(),
      organizationId: pkUnpadId,
      isAlumn: false
    })

    expect(rows.find((r) => r.organizationId === pkUnpadId)).toBeUndefined()
  })

  it('still gives Root aggregates for any Struktur', async () => {
    const rows = await readMemberAggregates({
      user: root,
      organizationId: pkUnpadId,
      isAlumn: false
    })

    expect(rows.find((r) => r.organizationId === pkUnpadId)?.total).toBe(1)
  })
})
