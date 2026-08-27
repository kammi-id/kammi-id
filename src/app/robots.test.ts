import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  mock
} from 'bun:test'
import { eq, sql } from 'drizzle-orm'
import { db } from '~/db/db'
import { createOrganization } from '~/db/query/organization'
import { organization } from '~/db/schema/organization.sql'

let host = 'pw-jabar.kammi.id'
let useFakeHeaders = true

const actualNextHeaders = await import('next/headers')
let pwJabarId: string

mock.module('next/headers', () => ({
  ...actualNextHeaders,
  headers: (...args: Parameters<typeof actualNextHeaders.headers>) =>
    useFakeHeaders
      ? Promise.resolve(new Headers({ host }))
      : actualNextHeaders.headers(...args)
}))

const { default: robots } = await import('./robots')

afterAll(() => {
  useFakeHeaders = false
})

beforeAll(async () => {
  await db.execute(sql`TRUNCATE TABLE "user", "member", organization CASCADE`)

  const [pp] = await createOrganization({
    name: 'PP KAMMI',
    slug: 'pp-kammi',
    code: 'PP-00',
    type: 'pp',
    parentId: null,
    isNonActive: false
  })
  const [pwJabar] = await createOrganization({
    name: 'PW Jabar',
    slug: 'pw-jabar',
    code: 'PW-32',
    type: 'pw',
    parentId: pp.id,
    isNonActive: false
  })

  pwJabarId = pwJabar.id
  await db
    .update(organization)
    .set({ isSiteActive: true })
    .where(eq(organization.id, pwJabarId))
})

beforeEach(() => {
  host = 'pw-jabar.kammi.id'
})

describe('robots', () => {
  it('menyebut sitemap pada host permintaan untuk Situs aktif', async () => {
    expect(await robots()).toEqual({
      rules: [
        {
          userAgent: '*',
          allow: '/',
          disallow: ['/dashboard', '/login', '/api/']
        }
      ],
      sitemap: 'https://pw-jabar.kammi.id/sitemap.xml'
    })
  })

  it('menolak semua crawler untuk Situs belum aktif dan Struktur Non-Aktif', async () => {
    await db
      .update(organization)
      .set({ isSiteActive: false })
      .where(eq(organization.id, pwJabarId))
    expect(await robots()).toEqual({
      rules: { userAgent: '*', disallow: '/' }
    })

    await db
      .update(organization)
      .set({ isSiteActive: true, isNonActive: true })
      .where(eq(organization.id, pwJabarId))
    expect(await robots()).toEqual({
      rules: { userAgent: '*', disallow: '/' }
    })
  })

  it('menolak crawler untuk host yang tidak dikenali', async () => {
    host = 'attacker.example'

    expect(await robots()).toEqual({
      rules: { userAgent: '*', disallow: '/' }
    })
  })
})
