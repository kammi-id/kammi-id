import { beforeEach, describe, expect, test } from 'bun:test'
import { sql } from 'drizzle-orm'
import { db } from '~/db/db'
import { createOrganization } from './organization'

describe('createOrganization', () => {
  beforeEach(async () => {
    await db.execute(
      sql`TRUNCATE TABLE "session", "user", "organization" CASCADE`
    )
  })

  // ADR 0012: apex tidak boleh mati begitu dibuat — mirrors the migration
  // that turns Situs Aktif on for PP rows that already existed (ticket 02).
  test('turns Situs Aktif on for a new PP', async () => {
    const [pp] = await createOrganization({
      name: 'PP KAMMI',
      slug: 'pp-baru',
      code: 'PP-BARU',
      type: 'pp'
    })

    expect(pp?.isSiteActive).toBe(true)
  })

  test('leaves Situs Aktif off for any Struktur other than PP', async () => {
    const [pw] = await createOrganization({
      name: 'PW Jabar',
      slug: 'pw-jabar-baru',
      code: 'PW-BARU',
      type: 'pw'
    })

    expect(pw?.isSiteActive).toBe(false)
  })
})
