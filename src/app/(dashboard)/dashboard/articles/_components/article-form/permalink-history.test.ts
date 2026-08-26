import { expect, test, it, describe, beforeAll, afterAll, mock } from 'bun:test'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { article } from '~/db/schema/article.sql'
import { articlePermalinkHistory } from '~/db/schema/article-permalink-history.sql'
import { eq, inArray } from 'drizzle-orm'

/**
 * Ticket 10 (Riwayat alamat Berita, ADR 0014). Tabel `article_permalink_history`
 * BELUM ada secara fisik sampai migrasi digenerate terpusat (batasan tiket)
 * — describe ini DIHARAPKAN merah dengan `relation does not exist` sampai
 * saat itu. `updateArticleAction` dipanggil sungguhan terhadap basis data
 * (bukan mock DB), sesi dipalsukan lewat `mock.module` mengikuti pola
 * `branches/_components/add-form/action.test.ts`.
 */
mock.module('~/lib/auth/cookies', () => ({
  readActiveSession: async () => ({
    user: {
      id: 'actor-permalink-history',
      role: 'root',
      connectedOrganization: null
    }
  })
}))

// `updateArticleAction` memanggil `revalidatePath`/`updateTag`, yang
// menuntut konteks request Next.js yang tidak ada saat action ini dipanggil
// langsung dari `bun test`. Dipalsukan di sini mengikuti pola yang sudah
// dipakai luas di repo ini (lihat `branches/_components/add-form/action.test.ts`
// dan berkas action test lain) — bukan memalsukan basis data atau logika
// bisnis, cuma sisi efek Next.js yang tidak relevan dengan yang diuji.
mock.module('next/cache', () => ({
  revalidatePath: () => undefined,
  updateTag: () => undefined
}))

const { updateArticleAction } = await import('./action')

describe('updateArticleAction — riwayat alamat Berita', () => {
  const suffix = Date.now().toString(36)
  const orgIds: string[] = []
  const articleIds: string[] = []

  let orgId: string

  const seedTerbit = async (slug: string, publishedAt: Date) => {
    const [row] = await db
      .insert(article)
      .values({
        organizationId: orgId,
        type: 'blog',
        title: `Judul ${suffix}`,
        slug,
        body: { type: 'doc', content: [] },
        status: 'published',
        publishedAt
      })
      .returning()
    articleIds.unshift(row.id)
    return row
  }

  const baseInput = (overrides: Record<string, unknown> = {}) => ({
    organizationId: orgId,
    type: 'blog' as const,
    title: `Judul ${suffix}`,
    slug: `tetap-${suffix}`,
    body: { type: 'doc', content: [] },
    status: 'published' as const,
    tags: [] as string[],
    ...overrides
  })

  beforeAll(async () => {
    const [org] = await db
      .insert(organization)
      .values({
        name: `Riwayat Action Org ${suffix}`,
        slug: `riwayat-action-org-${suffix}`,
        code: `RAO-${suffix}`,
        type: 'pk',
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgId = org.id
    orgIds.unshift(orgId)
  })

  afterAll(async () => {
    if (articleIds.length > 0) {
      await db
        .delete(articlePermalinkHistory)
        .where(inArray(articlePermalinkHistory.articleId, articleIds))
      await db.delete(article).where(inArray(article.id, articleIds))
    }
    await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  it('menyimpan riwayat saat slug Berita Terbit diubah', async () => {
    const oldSlug = `slug-lama-${suffix}`
    const seeded = await seedTerbit(oldSlug, new Date('2026-01-05T00:00:00Z'))

    const result = await updateArticleAction(
      seeded.id,
      baseInput({
        slug: `slug-baru-${suffix}`,
        publishedAt: '2026-01-05T00:00:00.000Z'
      })
    )

    expect(result.success).toBe(true)

    const history = await db
      .select()
      .from(articlePermalinkHistory)
      .where(eq(articlePermalinkHistory.articleId, seeded.id))
    expect(history).toHaveLength(1)
    expect(history[0]?.oldSlug).toBe(oldSlug)
    expect(history[0]?.oldTahun).toBe(2026)
    expect(history[0]?.oldBulan).toBe(1)
  })

  it('menyimpan riwayat saat tanggal terbit Berita Terbit digeser ke bulan lain, slug tetap', async () => {
    const slug = `slug-tetap-${suffix}`
    const seeded = await seedTerbit(slug, new Date('2026-01-05T00:00:00Z'))

    const result = await updateArticleAction(
      seeded.id,
      baseInput({ slug, publishedAt: '2026-03-05T00:00:00.000Z' })
    )

    expect(result.success).toBe(true)

    const history = await db
      .select()
      .from(articlePermalinkHistory)
      .where(eq(articlePermalinkHistory.articleId, seeded.id))
    expect(history).toHaveLength(1)
    expect(history[0]?.oldTahun).toBe(2026)
    expect(history[0]?.oldBulan).toBe(1)
  })

  it('tidak menyimpan riwayat saat tanggal bergeser dalam bulan yang sama (Permalink tidak berubah)', async () => {
    const slug = `slug-sama-bulan-${suffix}`
    const seeded = await seedTerbit(slug, new Date('2026-01-05T00:00:00Z'))

    const result = await updateArticleAction(
      seeded.id,
      baseInput({ slug, publishedAt: '2026-01-20T00:00:00.000Z' })
    )

    expect(result.success).toBe(true)

    const history = await db
      .select()
      .from(articlePermalinkHistory)
      .where(eq(articlePermalinkHistory.articleId, seeded.id))
    expect(history).toHaveLength(0)
  })

  it('tidak menyimpan riwayat untuk Berita draft (belum Terbit) yang slug-nya diubah', async () => {
    const [draft] = await db
      .insert(article)
      .values({
        organizationId: orgId,
        type: 'blog',
        title: `Judul Draft ${suffix}`,
        slug: `draft-lama-${suffix}`,
        body: { type: 'doc', content: [] },
        status: 'draft',
        publishedAt: null
      })
      .returning()
    articleIds.unshift(draft.id)

    const result = await updateArticleAction(
      draft.id,
      baseInput({
        slug: `draft-baru-${suffix}`,
        status: 'draft',
        publishedAt: '2026-01-05T00:00:00.000Z'
      })
    )

    expect(result.success).toBe(true)

    const history = await db
      .select()
      .from(articlePermalinkHistory)
      .where(eq(articlePermalinkHistory.articleId, draft.id))
    expect(history).toHaveLength(0)
  })
})
