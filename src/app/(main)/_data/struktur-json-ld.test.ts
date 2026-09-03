import { describe, it, expect, beforeAll, afterAll, mock } from 'bun:test'
import { inArray } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'

// `cacheLife`/`cacheTag` throw outside a real Next.js `cacheComponents`
// render (same reason `struktur.test.ts` stubs them) — stub them to no-ops
// so the real `readOrganization` underneath `getStrukturJsonLdOrganization`
// can run against a real database for this file's tests. Delegates to the
// real implementation once this file is done, following the same
// leak-prevention pattern as `struktur.test.ts` for `bun test`'s shared
// process (`--isolate` isolates leaked handles, not necessarily every
// module registry entry — this file does not assume which).
let useFakeNextCache = true
const actualNextCache = await import('next/cache')
mock.module('next/cache', () => ({
  ...actualNextCache,
  cacheLife: (...args: Parameters<typeof actualNextCache.cacheLife>) =>
    useFakeNextCache ? undefined : actualNextCache.cacheLife(...args),
  cacheTag: (...args: Parameters<typeof actualNextCache.cacheTag>) =>
    useFakeNextCache ? undefined : actualNextCache.cacheTag(...args)
}))

const { getStrukturJsonLdOrganization } = await import('./struktur')

afterAll(() => {
  useFakeNextCache = false
})

/**
 * Ticket 02 — the invariant that matters for JSON-LD's `subOrganization`:
 * Terhapus, Non-Aktif, and Situs-not-yet-active children never appear
 * (ADR 0013, "menautkan ke alamat yang tidak melayani adalah tautan mati
 * yang kita buat sendiri"). Real rows, not mocked `readOrganization`,
 * because the thing under test is the filter *combination* passed to it —
 * a mock would just echo back whatever the test already asserts.
 */
describe('getStrukturJsonLdOrganization', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []

  let pp: { id: string; slug: string }
  let pwAktif: { id: string; slug: string }
  let pwNonAktif: { id: string; slug: string }
  let pwSitusBelumAktif: { id: string; slug: string }
  let pwTerhapus: { id: string; slug: string }

  const insertOrg = async (values: {
    name: string
    type: 'pp' | 'pw' | 'pd' | 'pk'
    parentId: string | null
    isNonActive?: boolean
    isSiteActive?: boolean
    deletedAt?: Date | null
    logo?: string | null
  }) => {
    const [row] = await db
      .insert(organization)
      .values({
        name: values.name,
        slug: `${values.name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
        code: `${values.name.toUpperCase().replace(/\s+/g, '-')}-${suffix}`,
        type: values.type,
        parentId: values.parentId,
        isNonActive: values.isNonActive ?? false,
        isSiteActive: values.isSiteActive ?? false,
        deletedAt: values.deletedAt ?? null,
        logo: values.logo ?? null
      })
      .returning({ id: organization.id, slug: organization.slug })
    orgIds.push(row.id)
    return row
  }

  beforeAll(async () => {
    pp = await insertOrg({
      name: `PP JsonLd ${suffix}`,
      type: 'pp',
      parentId: null,
      isSiteActive: true,
      logo: '/api/images/pp-logo.png'
    })
    pwAktif = await insertOrg({
      name: `PW Aktif JsonLd ${suffix}`,
      type: 'pw',
      parentId: pp.id,
      isSiteActive: true
    })
    pwNonAktif = await insertOrg({
      name: `PW NonAktif JsonLd ${suffix}`,
      type: 'pw',
      parentId: pp.id,
      isSiteActive: true,
      isNonActive: true
    })
    pwSitusBelumAktif = await insertOrg({
      name: `PW SitusBelumAktif JsonLd ${suffix}`,
      type: 'pw',
      parentId: pp.id,
      isSiteActive: false
    })
    pwTerhapus = await insertOrg({
      name: `PW Terhapus JsonLd ${suffix}`,
      type: 'pw',
      parentId: pp.id,
      isSiteActive: true,
      deletedAt: new Date()
    })
  })

  afterAll(async () => {
    await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  it('returns null without touching the database when organizationId is null', async () => {
    expect(await getStrukturJsonLdOrganization(null)).toBeNull()
  })

  it('returns null for an id that resolves to no row', async () => {
    expect(
      await getStrukturJsonLdOrganization(
        '00000000-0000-0000-0000-000000000000'
      )
    ).toBeNull()
  })

  it('has no parent for PP', async () => {
    const result = await getStrukturJsonLdOrganization(pp.id)
    expect(result?.parent).toBeNull()
  })

  it("resolves the logo relative to the Struktur's own host", async () => {
    const result = await getStrukturJsonLdOrganization(pp.id)
    expect(result?.logo).toBe('https://www.kammi.id/api/images/pp-logo.png')
  })

  it('omits logo entirely for a Struktur with none set', async () => {
    const result = await getStrukturJsonLdOrganization(pwAktif.id)
    expect(result && 'logo' in result).toBe(false)
  })

  it("resolves the direct induk's {type, slug}", async () => {
    const result = await getStrukturJsonLdOrganization(pwAktif.id)
    expect(result?.parent).toEqual({ type: 'pp', slug: pp.slug })
  })

  it('lists only the site-active, non-Non-Aktif, non-Terhapus direct anak', async () => {
    const result = await getStrukturJsonLdOrganization(pp.id)
    expect(result?.children).toEqual([{ type: 'pw', slug: pwAktif.slug }])

    // The excluded siblings are real rows, not absent ones — proving the
    // filter, not just an empty table.
    const excludedSlugs = [
      pwNonAktif.slug,
      pwSitusBelumAktif.slug,
      pwTerhapus.slug
    ]
    for (const slug of excludedSlugs) {
      expect(result?.children.some((child) => child.slug === slug)).toBe(false)
    }
  })
})
