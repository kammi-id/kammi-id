import { describe, it, expect, beforeEach } from 'bun:test'
import { db } from '~/db/db'
import { createOrganization, fetchAllowedOrgIds } from '~/db/query/organization'
import { sql } from 'drizzle-orm'

describe('Hierarchical Access Control', () => {
  let ppId: string
  let pwJabarId: string
  let pwJatimId: string
  let pdBandungId: string
  let pkItbId: string
  let pkUnpadId: string

  beforeEach(async () => {
    // Clean up
    await db.execute(sql`TRUNCATE TABLE "user", organization CASCADE`)

    // Create Hierarchy
    // PP
    const [pp] = await createOrganization({
      name: 'PP KAMMI',
      slug: 'pp',
      type: 'pp',
      parentId: null,
      isNonActive: false
    })
    ppId = pp.id

    // PW Jabar
    const [pwJabar] = await createOrganization({
      name: 'PW Jabar',
      slug: 'pw-jabar',
      type: 'pw',
      parentId: ppId,
      isNonActive: false
    })
    pwJabarId = pwJabar.id

    // PW Jatim
    const [pwJatim] = await createOrganization({
      name: 'PW Jatim',
      slug: 'pw-jatim',
      type: 'pw',
      parentId: ppId,
      isNonActive: false
    })
    pwJatimId = pwJatim.id

    // PD Bandung
    const [pdBandung] = await createOrganization({
      name: 'PD Bandung',
      slug: 'pd-bandung',
      type: 'pd',
      parentId: pwJabarId,
      isNonActive: false
    })
    pdBandungId = pdBandung.id

    // PK ITB
    const [pkItb] = await createOrganization({
      name: 'PK ITB',
      slug: 'pk-itb',
      type: 'pk',
      parentId: pdBandungId,
      isNonActive: false
    })
    pkItbId = pkItb.id

    // PK UNPAD
    const [pkUnpad] = await createOrganization({
      name: 'PK UNPAD',
      slug: 'pk-unpad',
      type: 'pk',
      parentId: pdBandungId,
      isNonActive: false
    })
    pkUnpadId = pkUnpad.id
  })

  it('should allow root to access all organizations', async () => {
    const allowed = await fetchAllowedOrgIds({
      role: 'root',
      connectedOrganizationId: null
    })
    expect(allowed).toContain(ppId)
    expect(allowed).toContain(pwJabarId)
    expect(allowed).toContain(pwJatimId)
    expect(allowed).toContain(pdBandungId)
    expect(allowed).toContain(pkItbId)
    expect(allowed).toContain(pkUnpadId)
  })

  it('should allow PW to access its subtree (PW, PD, PK)', async () => {
    const allowed = await fetchAllowedOrgIds({
      role: 'bpw',
      connectedOrganizationId: pwJabarId
    })
    expect(allowed).toContain(pwJabarId)
    expect(allowed).toContain(pdBandungId)
    expect(allowed).toContain(pkItbId)
    expect(allowed).toContain(pkUnpadId)
    expect(allowed).not.toContain(ppId)
    expect(allowed).not.toContain(pwJatimId)
  })

  it('should allow PD to access its subtree (PD, PK)', async () => {
    const allowed = await fetchAllowedOrgIds({
      role: 'bph',
      connectedOrganizationId: pdBandungId
    })
    expect(allowed).toContain(pdBandungId)
    expect(allowed).toContain(pkItbId)
    expect(allowed).toContain(pkUnpadId)
    expect(allowed).not.toContain(pwJabarId)
    expect(allowed).not.toContain(ppId)
  })

  it('should allow PK to access only itself', async () => {
    const allowed = await fetchAllowedOrgIds({
      role: 'member',
      connectedOrganizationId: pkItbId
    })
    expect(allowed).toEqual([pkItbId])
  })

  it('should restrict Humas to only their own organization', async () => {
    const allowed = await fetchAllowedOrgIds({
      role: 'humas',
      connectedOrganizationId: pwJabarId
    })
    expect(allowed).toEqual([pwJabarId])
    expect(allowed).not.toContain(pdBandungId)
  })

  it('should return empty list if user has no connected organization (non-root)', async () => {
    const allowed = await fetchAllowedOrgIds({
      role: 'bph',
      connectedOrganizationId: null
    })
    expect(allowed).toEqual([])
  })

  it('should isolate data between organizations at the same level', async () => {
    const allowedJabar = await fetchAllowedOrgIds({
      role: 'bpw',
      connectedOrganizationId: pwJabarId
    })
    const allowedJatim = await fetchAllowedOrgIds({
      role: 'bpw',
      connectedOrganizationId: pwJatimId
    })

    expect(allowedJabar).toContain(pwJabarId)
    expect(allowedJabar).not.toContain(pwJatimId)

    expect(allowedJatim).toContain(pwJatimId)
    expect(allowedJatim).not.toContain(pwJabarId)
  })
})
