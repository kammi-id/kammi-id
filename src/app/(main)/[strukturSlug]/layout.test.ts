import { describe, it, expect, beforeAll, afterAll, mock } from 'bun:test'
import { inArray } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'

// Same stub as `struktur-json-ld.test.ts`: `cacheLife`/`cacheTag` throw
// outside a real Next.js `cacheComponents` render, so they're no-ops here
// while the real `readOrganization` underneath runs against a real database.
let useFakeNextCache = true
const actualNextCache = await import('next/cache')
mock.module('next/cache', () => ({
  ...actualNextCache,
  cacheLife: (...args: Parameters<typeof actualNextCache.cacheLife>) =>
    useFakeNextCache ? undefined : actualNextCache.cacheLife(...args),
  cacheTag: (...args: Parameters<typeof actualNextCache.cacheTag>) =>
    useFakeNextCache ? undefined : actualNextCache.cacheTag(...args)
}))

const { generateMetadata } = await import('./layout')

afterAll(() => {
  useFakeNextCache = false
})

/**
 * Ticket 02's other untested seam: `metadataBase` no longer comes from the
 * root layout's hardcoded `www.kammi.id` — it's per-Struktur, set here, and
 * every route's relative `alternates.canonical` resolves against it. If this
 * drifts, canonical URLs silently point at the wrong host for every
 * non-PP Struktur even though the canonical *paths* themselves look correct
 * in isolation.
 */
describe('[strukturSlug]/layout generateMetadata', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []

  let pp: { id: string; slug: string }
  let pwAktif: { id: string; slug: string }
  let pwNonAktif: { id: string; slug: string }

  const insertOrg = async (values: {
    name: string
    type: 'pp' | 'pw'
    parentId: string | null
    isNonActive?: boolean
  }) => {
    const [row] = await db
      .insert(organization)
      .values({
        name: values.name,
        slug: `${values.name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
        code: `${values.name.toUpperCase().replace(/\s+/g, '-')}-${suffix}`,
        type: values.type,
        parentId: values.parentId,
        isSiteActive: true,
        isNonActive: values.isNonActive ?? false
      })
      .returning({ id: organization.id, slug: organization.slug })
    orgIds.push(row.id)
    return row
  }

  beforeAll(async () => {
    pp = await insertOrg({
      name: `PP Layout ${suffix}`,
      type: 'pp',
      parentId: null
    })
    pwAktif = await insertOrg({
      name: `PW Aktif Layout ${suffix}`,
      type: 'pw',
      parentId: pp.id
    })
    pwNonAktif = await insertOrg({
      name: `PW NonAktif Layout ${suffix}`,
      type: 'pw',
      parentId: pp.id,
      isNonActive: true
    })
  })

  afterAll(async () => {
    await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  const params = (strukturSlug: string) => Promise.resolve({ strukturSlug })

  it("resolves PP's metadataBase to the apex host", async () => {
    const metadata = await generateMetadata({ params: params(pp.slug) })
    expect(metadata.metadataBase?.toString()).toBe('https://www.kammi.id/')
  })

  it("resolves a PW's metadataBase to its own subdomain, not PP's", async () => {
    const metadata = await generateMetadata({ params: params(pwAktif.slug) })
    expect(metadata.metadataBase?.toString()).toBe(
      `https://${pwAktif.slug}.kammi.id/`
    )
  })

  it('still resolves the correct host for a Non-Aktif Struktur (its Berita permalink archive stays live, ADR 0013)', async () => {
    const metadata = await generateMetadata({ params: params(pwNonAktif.slug) })
    expect(metadata.metadataBase?.toString()).toBe(
      `https://${pwNonAktif.slug}.kammi.id/`
    )
  })

  it('returns empty metadata for an unresolvable slug', async () => {
    const metadata = await generateMetadata({
      params: params(`ghost-${suffix}`)
    })
    expect(metadata).toEqual({})
  })
})
