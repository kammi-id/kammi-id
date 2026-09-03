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

// Resolusi Host sama seperti `robots.test.ts`/`sitemap.test.ts` — DB
// sungguhan lewat `readOrganization`, bukan mock, karena modul itu dipakai
// bersama banyak berkas uji lain dalam satu proses `bun test` dan menimpanya
// tanpa `...actual`/pemulihan akan membocor ke berkas lain (lihat komentar
// `proxy.test.ts`). `getStrukturIdentity` beda cerita: dibungkus `'use
// cache'`, yang melempar di luar runtime Next (`cacheLife()` menuntut
// `cacheComponents`) — jadi tetap di-mock di sini, sama seperti setiap uji
// rute Salinan Markdown lain memock `_data/struktur`.

let host = 'pw-jabar.kammi.id'
let useFakeHeaders = true
let identityName = 'PW Jabar'

const actualNextHeaders = await import('next/headers')
let pwJabarId: string

mock.module('next/headers', () => ({
  ...actualNextHeaders,
  headers: (...args: Parameters<typeof actualNextHeaders.headers>) =>
    useFakeHeaders
      ? Promise.resolve(new Headers({ host }))
      : actualNextHeaders.headers(...args)
}))

mock.module('~/app/(main)/_data/struktur', () => ({
  getStrukturIdentity: async (organizationId: string | null) =>
    organizationId ? { id: organizationId, name: identityName } : null
}))

const { GET } = await import('./route')

afterAll(() => {
  useFakeHeaders = false
})

beforeAll(async () => {
  await db.execute(sql`TRUNCATE TABLE "user", "member", organization CASCADE`)

  const [pp] = await createOrganization({
    name: 'PP KAMMI',
    slug: 'kammi',
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
  await db
    .update(organization)
    .set({ isSiteActive: true })
    .where(eq(organization.id, pp.id))
})

beforeEach(() => {
  host = 'pw-jabar.kammi.id'
  identityName = 'PW Jabar'
})

describe('GET /llms.txt', () => {
  it('membalas 200 dengan front-matter llmstxt.org dan tautan .md ke Tentang, Berita, Pengurus', async () => {
    const res = await GET()

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8')

    const text = await res.text()
    expect(text.startsWith('# PW Jabar\n')).toBe(true)
    expect(text).toContain('> PW Jabar, KAMMI tingkat Wilayah.')
    expect(text).toContain('## Tentang')
    expect(text).toContain('https://pw-jabar.kammi.id/tentang.md')
    expect(text).toContain('## Berita')
    expect(text).toContain('https://pw-jabar.kammi.id/berita.md')
    expect(text).toContain('## Pengurus')
    expect(text).toContain('https://pw-jabar.kammi.id/tentang/pengurus.md')
  })

  it('tidak memuat bagian Berita KAMMI se-Indonesia untuk PW', async () => {
    const res = await GET()
    const text = await res.text()

    expect(text).not.toContain('Berita KAMMI se-Indonesia')
  })

  it('memuat bagian Berita KAMMI se-Indonesia hanya untuk PP', async () => {
    host = 'www.kammi.id'
    identityName = 'PP KAMMI'

    const res = await GET()
    const text = await res.text()

    expect(text).toContain('## Berita KAMMI se-Indonesia')
    expect(text).toContain('https://www.kammi.id/berita/seindonesia')
  })

  it('menjawab 404 ketika Situs belum Aktif dan untuk Struktur Non-Aktif', async () => {
    await db
      .update(organization)
      .set({ isSiteActive: false })
      .where(eq(organization.id, pwJabarId))
    expect((await GET()).status).toBe(404)

    await db
      .update(organization)
      .set({ isSiteActive: true, isNonActive: true })
      .where(eq(organization.id, pwJabarId))
    expect((await GET()).status).toBe(404)

    await db
      .update(organization)
      .set({ isNonActive: false })
      .where(eq(organization.id, pwJabarId))
  })

  it('menjawab 404 untuk host yang tidak dikenali', async () => {
    host = 'attacker.example'

    const res = await GET()

    expect(res.status).toBe(404)
  })
})
