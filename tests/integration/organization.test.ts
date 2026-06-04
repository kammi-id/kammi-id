import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '~/db/db'
import { sql } from 'drizzle-orm'
import { createOrganization, fetchAllowedOrgIds } from '~/db/query/organization'

const truncate = async () => {
  await db.execute(sql`TRUNCATE TABLE "user", organization CASCADE`)
}

const seed = async () => {
  const [pp] = await createOrganization({
    name: 'PP KAMMI',
    slug: 'pp',
    code: 'PP',
    type: 'pp',
    parentId: null,
    isNonActive: false
  })
  const [pw] = await createOrganization({
    name: 'PW Jabar',
    slug: 'pw-jabar',
    code: 'PW 01',
    type: 'pw',
    parentId: pp.id,
    isNonActive: false
  })
  const [pd] = await createOrganization({
    name: 'PD Bandung',
    slug: 'pd-bandung',
    code: '01.PD-1',
    type: 'pd',
    parentId: pw.id,
    isNonActive: false
  })
  const [pk] = await createOrganization({
    name: 'PK ITB',
    slug: 'pk-itb',
    code: '01.PK-1',
    type: 'pk',
    parentId: pd.id,
    isNonActive: false
  })
  return { pp, pw, pd, pk }
}

describe('createOrganization', () => {
  beforeEach(truncate)

  it('creates a root organization with correct fields', async () => {
    const [org] = await createOrganization({
      name: 'PP KAMMI',
      slug: 'pp',
      code: 'PP',
      type: 'pp',
      parentId: null,
      isNonActive: false
    })
    expect(org.id).toBeDefined()
    expect(org.name).toBe('PP KAMMI')
    expect(org.type).toBe('pp')
    expect(org.level).toBe(1)
  })

  it('creates child organizations with correct hierarchy level', async () => {
    const { pp, pw, pd, pk } = await seed()
    expect(pp.level).toBe(1)
    expect(pw.level).toBe(2)
    expect(pd.level).toBe(3)
    expect(pk.level).toBe(4)
  })

  it('auto-creates user credentials for each role', async () => {
    const [org] = await createOrganization({
      name: 'PW Test',
      slug: 'pw-test',
      code: 'PW 01',
      type: 'pw',
      parentId: null,
      isNonActive: false
    })
    expect(org.credentials).toBeDefined()
    expect(org.credentials.length).toBeGreaterThan(0)
    expect(org.credentials[0].name).toBeDefined()
    expect(org.credentials[0].password).toBeDefined()
  })
})

describe('fetchAllowedOrgIds', () => {
  beforeEach(truncate)

  it('root can access all organizations', async () => {
    const { pp, pw, pd, pk } = await seed()
    const allowed = await fetchAllowedOrgIds({
      role: 'root',
      connectedOrganizationId: null
    })
    expect(allowed).toContain(pp.id)
    expect(allowed).toContain(pw.id)
    expect(allowed).toContain(pd.id)
    expect(allowed).toContain(pk.id)
  })

  it('bpw can access its subtree (PW + PD + PK descendants)', async () => {
    const { pp, pw, pd, pk } = await seed()
    const allowed = await fetchAllowedOrgIds({
      role: 'bpw',
      connectedOrganizationId: pw.id
    })
    expect(allowed).toContain(pw.id)
    expect(allowed).toContain(pd.id)
    expect(allowed).toContain(pk.id)
    expect(allowed).not.toContain(pp.id)
  })

  it('humas can only access their own organization', async () => {
    const { pp, pw } = await seed()
    const allowed = await fetchAllowedOrgIds({
      role: 'humas',
      connectedOrganizationId: pw.id
    })
    expect(allowed).toEqual([pw.id])
    expect(allowed).not.toContain(pp.id)
  })

  it('returns empty list when non-root has no connected org', async () => {
    await seed()
    const allowed = await fetchAllowedOrgIds({
      role: 'bph',
      connectedOrganizationId: null
    })
    expect(allowed).toEqual([])
  })

  it('isolates data between sibling organizations', async () => {
    const [pp] = await createOrganization({
      name: 'PP',
      slug: 'pp',
      code: 'PP',
      type: 'pp',
      parentId: null,
      isNonActive: false
    })
    const [pw1] = await createOrganization({
      name: 'PW 1',
      slug: 'pw-1',
      code: 'PW 01',
      type: 'pw',
      parentId: pp.id,
      isNonActive: false
    })
    const [pw2] = await createOrganization({
      name: 'PW 2',
      slug: 'pw-2',
      code: 'PW 02',
      type: 'pw',
      parentId: pp.id,
      isNonActive: false
    })
    const allowedPw1 = await fetchAllowedOrgIds({
      role: 'bpw',
      connectedOrganizationId: pw1.id
    })
    const allowedPw2 = await fetchAllowedOrgIds({
      role: 'bpw',
      connectedOrganizationId: pw2.id
    })
    expect(allowedPw1).not.toContain(pw2.id)
    expect(allowedPw2).not.toContain(pw1.id)
  })
})
