import { afterAll, describe, expect, test } from 'bun:test'
import { SQL } from 'bun'
import { readFileSync } from 'node:fs'
import { requireDatabaseConsent } from '~/lib/db-guard/consent'

requireDatabaseConsent()
const client = new SQL({ url: process.env.DATABASE_URL!, max: 1 })
afterAll(() => client.close())
const migration = readFileSync(
  new URL(
    './__migrations/20261015072542_publication-instant/migration.sql',
    import.meta.url
  ),
  'utf8'
)

describe('published_at migration preserves WIB history', () => {
  for (const timezone of ['UTC', 'Asia/Tokyo']) {
    test(`forward and rollback are independent of session timezone ${timezone}`, async () => {
      await client.begin(async (tx) => {
        await tx.unsafe(`SET LOCAL TIME ZONE '${timezone}'`)
        // pg_temp shadows public.article: only disposable fixtures are altered.
        await tx`CREATE TEMP TABLE article (id integer, published_at timestamp) ON COMMIT DROP`
        await tx`INSERT INTO article VALUES
          (1, '2026-01-01 00:00:00'),
          (2, '2026-01-01 06:00:00.123456'),
          (3, '2026-01-31 23:59:59.999999'),
          (4, '2026-10-15 13:53:00'),
          (5, '2026-10-15 14:53:00'),
          (6, NULL)`
        const before = await tx`SELECT id, published_at::text AS wall,
          to_char(published_at, 'YYYY/MM') AS permalink_month,
          published_at <= timestamp '2026-10-15 13:53:00' AS eligible
          FROM article ORDER BY id`
        await tx.unsafe(migration)
        const after = await tx`SELECT id,
          (published_at AT TIME ZONE 'Asia/Jakarta')::text AS wall,
          to_char(published_at AT TIME ZONE 'Asia/Jakarta', 'YYYY/MM') AS permalink_month,
          published_at <= timestamptz '2026-10-15 06:53:00Z' AS eligible
          FROM article ORDER BY id`
        expect([...after]).toEqual([...before])
        const [instant] =
          await tx`SELECT published_at FROM article WHERE id = 1`
        expect(instant.published_at.toISOString()).toBe(
          '2025-12-31T17:00:00.000Z'
        )
        await tx`ALTER TABLE article ALTER COLUMN published_at TYPE timestamp
          USING published_at AT TIME ZONE 'Asia/Jakarta'`
        const restored = await tx`SELECT id, published_at::text AS wall,
          to_char(published_at, 'YYYY/MM') AS permalink_month,
          published_at <= timestamp '2026-10-15 13:53:00' AS eligible
          FROM article ORDER BY id`
        expect([...restored]).toEqual([...before])
      })
    })
  }
})
