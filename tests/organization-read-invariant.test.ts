import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { inArray, eq } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { member } from '~/db/schema/member.sql'
import { training } from '~/db/schema/training.sql'
import { article } from '~/db/schema/article.sql'
import { articleCategory } from '~/db/schema/article-category.sql'
import { siteSettings } from '~/db/schema/site-settings.sql'
import {
  countOrganization,
  fetchAllowedOrgIds,
  readDeletedOrganizations,
  readOrgHierarchyChain,
  readOrganization
} from '~/db/query/organization'
import { readDescendantMembers, readMemberAggregates } from '~/db/query/member'
import { trainingQuery } from '~/db/query/training'
import { articleQuery } from '~/db/query/article'
import { articleCategoryQuery } from '~/db/query/article-category'
import { readSiteSettings } from '~/db/query/site-settings'

/**
 * Tiket 20 — invarian lapisan baca (spec §7, §1.4).
 *
 * Satu aturan dengan dua sisi, dan kedua sisi diuji di tiap lapis: **Terhapus
 * disaring, Non-Aktif tidak.** Asimetri itu yang membuat tiket 27 sah, jadi
 * pelolosan Non-Aktif diuji sekeras penyaringan Terhapus — bukan diasumsikan.
 *
 * Pohonnya sengaja punya satu PD Terhapus **dan** satu PD Non-Aktif di bawah
 * induk yang sama: tiap pembacaan lalu punya dua jawaban benar yang berbeda
 * untuk dibedakan, dan pembaca yang menyaring keduanya sekaligus gagal di sini
 * alih-alih lolos.
 */

const suffix = Date.now().toString(36)

const insertOrg = async (values: {
  name: string
  type: 'pp' | 'pw' | 'pd' | 'pk'
  parentId: string | null
  isNonActive?: boolean
  deletedAt?: Date | null
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
      deletedAt: values.deletedAt ?? null
    })
    .returning({ id: organization.id, slug: organization.slug })
  return row
}

const insertMember = async (organizationId: string, name: string) => {
  const [row] = await db
    .insert(member)
    .values({
      name,
      organizationId,
      registerNumber: `${name.replace(/\s+/g, '')}-${suffix}`,
      status: 'ab1',
      gender: 'ikhwan',
      yearOfEntry: 2024,
      isAlumn: false,
      isSuspended: false,
      isNonActive: false
    })
    .returning({ id: member.id })
  return row.id
}

describe('Invarian lapisan baca Struktur', () => {
  let pp: { id: string; slug: string }
  let pw: { id: string; slug: string }
  let pdAktif: { id: string; slug: string }
  let pdNonAktif: { id: string; slug: string }
  let pdTerhapus: { id: string; slug: string }
  let pwTerhapus: { id: string; slug: string }

  const orgIds: string[] = []
  const memberIds: string[] = []
  const trainingIds: string[] = []
  const articleIds: string[] = []
  const categoryIds: string[] = []
  let categoryOfAktif: string
  let categoryOfTerhapus: string

  const root = { role: 'root', connectedOrganizationId: null }
  let bpwPP: { role: string; connectedOrganizationId: string }

  beforeAll(async () => {
    pp = await insertOrg({
      name: `PP Inv ${suffix}`,
      type: 'pp',
      parentId: null
    })
    pw = await insertOrg({
      name: `PW Inv ${suffix}`,
      type: 'pw',
      parentId: pp.id
    })
    pdAktif = await insertOrg({
      name: `PD Aktif ${suffix}`,
      type: 'pd',
      parentId: pw.id
    })
    pdNonAktif = await insertOrg({
      name: `PD NonAktif ${suffix}`,
      type: 'pd',
      parentId: pw.id,
      isNonActive: true
    })
    pdTerhapus = await insertOrg({
      name: `PD Terhapus ${suffix}`,
      type: 'pd',
      parentId: pw.id,
      deletedAt: new Date()
    })
    pwTerhapus = await insertOrg({
      name: `PW Terhapus ${suffix}`,
      type: 'pw',
      parentId: pp.id,
      deletedAt: new Date()
    })
    orgIds.push(
      pdAktif.id,
      pdNonAktif.id,
      pdTerhapus.id,
      pwTerhapus.id,
      pw.id,
      pp.id
    )
    bpwPP = { role: 'bpw', connectedOrganizationId: pp.id }

    memberIds.push(await insertMember(pdAktif.id, `Kader Aktif ${suffix}`))
    memberIds.push(
      await insertMember(pdNonAktif.id, `Kader NonAktif ${suffix}`)
    )

    // Prasyarat penghapusan menjamin nol Member **hidup** di bawah Struktur
    // Terhapus; yang tersisa boleh berupa Kader yang sudah ikut dihapus.
    const ghost = await insertMember(pdTerhapus.id, `Kader Hantu ${suffix}`)
    memberIds.push(ghost)
    await db
      .update(member)
      .set({ deletedAt: new Date() })
      .where(eq(member.id, ghost))

    for (const [orgId, name] of [
      [pdAktif.id, 'DM1 Aktif'],
      [pdTerhapus.id, 'DM1 Terhapus']
    ] as const) {
      const [row] = await db
        .insert(training)
        .values({
          organizationId: orgId,
          name: `${name} ${suffix}`,
          startDate: '2025-01-01',
          endDate: '2025-01-03',
          type: 'dm1',
          identifier: 1
        })
        .returning({ id: training.id })
      trainingIds.push(row.id)
    }

    for (const [orgId, title] of [
      [pdAktif.id, 'Artikel Aktif'],
      [pdTerhapus.id, 'Artikel Terhapus']
    ] as const) {
      const [row] = await db
        .insert(article)
        .values({
          organizationId: orgId,
          type: 'blog',
          title: `${title} ${suffix}`,
          slug: `${title.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
          body: {}
        })
        .returning({ id: article.id })
      articleIds.push(row.id)
    }

    for (const [orgId, name] of [
      [pdAktif.id, 'Kategori Aktif'],
      [pdTerhapus.id, 'Kategori Terhapus']
    ] as const) {
      const [row] = await db
        .insert(articleCategory)
        .values({
          organizationId: orgId,
          name: `${name} ${suffix}`,
          slug: `${name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`
        })
        .returning({ id: articleCategory.id })
      categoryIds.push(row.id)
    }
    ;[categoryOfAktif, categoryOfTerhapus] = categoryIds

    await db.insert(siteSettings).values([
      {
        key: `inv-${suffix}`,
        organizationId: pdAktif.id,
        data: { v: 'aktif' }
      },
      {
        key: `inv-${suffix}`,
        organizationId: pdTerhapus.id,
        data: { v: 'terhapus' }
      }
    ])
  })

  afterAll(async () => {
    await db
      .delete(siteSettings)
      .where(inArray(siteSettings.organizationId, orgIds))
    if (articleIds.length)
      await db.delete(article).where(inArray(article.id, articleIds))
    if (categoryIds.length)
      await db
        .delete(articleCategory)
        .where(inArray(articleCategory.id, categoryIds))
    if (trainingIds.length)
      await db.delete(training).where(inArray(training.id, trainingIds))
    if (memberIds.length)
      await db.delete(member).where(inArray(member.id, memberIds))
    await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  describe('pembaca terpusat organization', () => {
    it('menjawab slug Struktur Terhapus dengan nihil, sama dengan slug yang tak pernah ada', async () => {
      const [found] = await readOrganization({ slug: pdTerhapus.slug })
      const [neverExisted] = await readOrganization({
        slug: `tidak-pernah-ada-${suffix}`
      })

      expect(found).toBeUndefined()
      expect(neverExisted).toBeUndefined()
    })

    it('meloloskan Struktur Non-Aktif lewat slug', async () => {
      const [found] = await readOrganization({ slug: pdNonAktif.slug })

      expect(found?.id).toBe(pdNonAktif.id)
      expect(found?.state).toBe('non_aktif')
    })

    it('tidak memunculkan Struktur Terhapus sebagai anak, dan tetap memunculkan yang Non-Aktif', async () => {
      const children = await readOrganization({ parentId: [pw.id] })
      const ids = children.map((c) => c.id)

      expect(ids).toContain(pdAktif.id)
      expect(ids).toContain(pdNonAktif.id)
      expect(ids).not.toContain(pdTerhapus.id)
    })

    it('tidak menghitung anak Terhapus di childrenCount', async () => {
      const [parent] = await readOrganization({ id: [pw.id] })

      expect(parent.childrenCount).toBe(2)
    })

    it('tidak menghitung Struktur Terhapus di countOrganization', async () => {
      expect(await countOrganization({ parentId: [pw.id] })).toBe(2)
    })

    it('memutus rantai leluhur di Struktur Terhapus', async () => {
      const pkYatim = await insertOrg({
        name: `PK Yatim ${suffix}`,
        type: 'pk',
        parentId: pdTerhapus.id
      })
      orgIds.unshift(pkYatim.id)

      const chain = await readOrgHierarchyChain(pkYatim.id)

      expect(chain.map((n) => n.id)).toEqual([pkYatim.id])
    })

    it('tidak memilih Struktur Terhapus lewat filter type', async () => {
      const soloTerhapus = await insertOrg({
        name: `PK Solo ${suffix}`,
        type: 'pk',
        parentId: pdAktif.id,
        deletedAt: new Date()
      })
      orgIds.unshift(soloTerhapus.id)

      const [found] = await readOrganization({ type: ['pk'], limit: 1 })
      expect(found?.id).not.toBe(soloTerhapus.id)
    })
  })

  describe('Cakupan', () => {
    it('mengeluarkan Struktur Terhapus dari Cakupan Root', async () => {
      const ids = await fetchAllowedOrgIds(root)

      expect(ids).not.toContain(pdTerhapus.id)
      expect(ids).not.toContain(pwTerhapus.id)
      expect(ids).toContain(pdNonAktif.id)
    })

    it('menghentikan penelusuran Cakupan di Struktur Terhapus, tanpa menghentikannya di Non-Aktif', async () => {
      const ids = await fetchAllowedOrgIds(bpwPP)

      expect(ids).toContain(pw.id)
      expect(ids).toContain(pdNonAktif.id)
      expect(ids).not.toContain(pdTerhapus.id)
      expect(ids).not.toContain(pwTerhapus.id)
    })
  })

  describe('lapisan Kader', () => {
    it('tidak memancarkan baris agregat untuk Struktur Terhapus', async () => {
      const rows = await readMemberAggregates({
        organizationId: pw.id,
        user: root
      })
      const byOrg = Object.fromEntries(rows.map((r) => [r.organizationId, r]))

      expect(byOrg[pdTerhapus.id]).toBeUndefined()
      expect(byOrg[pdNonAktif.id]).toBeDefined()
    })

    it('tetap mengagregasi Kader di bawah Struktur Non-Aktif ke induknya', async () => {
      const rows = await readMemberAggregates({
        organizationId: pw.id,
        user: root
      })
      const byOrg = Object.fromEntries(rows.map((r) => [r.organizationId, r]))

      expect(byOrg[pdNonAktif.id].total).toBe(1)
      expect(byOrg[pw.id].total).toBe(2)
    })

    it('tetap membaca Kader di bawah Struktur Non-Aktif dari daftar induknya', async () => {
      const [rows, total] = await readDescendantMembers(pw.id, { user: root })
      const orgIdsOfRows = rows.map((r) => r.organizationId)

      expect(total).toBe(2)
      expect(orgIdsOfRows).toContain(pdNonAktif.id)
      expect(orgIdsOfRows).not.toContain(pdTerhapus.id)
    })

    // Subtree-nya sendiri, bukan menumpang `pw`, sebab menambah Kader ke sana
    // akan mengubah dua hitungan yang diuji di atasnya.
    //
    // Bentuknya sengaja dibuat tangan: prasyarat penghapusan membuat PK hidup
    // di bawah PD Terhapus tak terjangkau lewat jalur mana pun. Justru itu
    // sebabnya ia diuji di sini — yang dijaga adalah bahwa pembacanya tidak
    // bersandar pada prasyarat itu untuk tetap jujur.
    it('tidak menyebut nama leluhur Terhapus di orgHierarchy, dan memutus rantainya di situ', async () => {
      const pwB = await insertOrg({
        name: `PW Leluhur ${suffix}`,
        type: 'pw',
        parentId: pp.id
      })
      const pdTerhapusB = await insertOrg({
        name: `PD Leluhur Terhapus ${suffix}`,
        type: 'pd',
        parentId: pwB.id,
        deletedAt: new Date()
      })
      const pkB = await insertOrg({
        name: `PK Leluhur ${suffix}`,
        type: 'pk',
        parentId: pdTerhapusB.id
      })
      orgIds.unshift(pkB.id, pdTerhapusB.id, pwB.id)
      memberIds.push(await insertMember(pkB.id, `Kader Leluhur ${suffix}`))

      const [rows] = await readDescendantMembers(pwB.id, { user: root })

      expect(rows).toHaveLength(1)
      expect(rows[0].orgHierarchy?.pk?.id).toBe(pkB.id)
      expect(rows[0].orgHierarchy?.pd).toBeNull()
      // PW-nya hidup, tapi jalan ke sana lewat PD Terhapus. Melompatinya akan
      // menyatakan garis keturunan yang tidak ada.
      expect(rows[0].orgHierarchy?.pw).toBeNull()
    })
  })

  describe('tabel yang mereferensi organization', () => {
    it('menyaring Daurah milik Struktur Terhapus', async () => {
      const terhapus = await trainingQuery.getAll({
        organizationId: pdTerhapus.id
      })
      const aktif = await trainingQuery.getAll({ organizationId: pdAktif.id })

      expect(terhapus.rows).toHaveLength(0)
      expect(terhapus.totalCount).toBe(0)
      expect(aktif.rows).toHaveLength(1)
    })

    it('menyaring Artikel milik Struktur Terhapus', async () => {
      const terhapus = await articleQuery.listForOrg(pdTerhapus.id, {})
      const aktif = await articleQuery.listForOrg(pdAktif.id, {})

      expect(terhapus).toHaveLength(0)
      expect(aktif).toHaveLength(1)
    })

    it('menyaring Kategori Artikel milik Struktur Terhapus, lewat daftar maupun lewat id', async () => {
      const terhapus = await articleCategoryQuery.listForOrg(pdTerhapus.id)
      const aktif = await articleCategoryQuery.listForOrg(pdAktif.id)

      expect(terhapus).toHaveLength(0)
      expect(aktif).toHaveLength(1)
      expect(
        await articleCategoryQuery.getById(categoryOfTerhapus)
      ).toBeUndefined()
      expect(await articleCategoryQuery.getById(categoryOfAktif)).toBeDefined()
    })

    it('menyaring Pengaturan Situs milik Struktur Terhapus', async () => {
      const terhapus = await readSiteSettings(
        `inv-${suffix}`,
        { v: 'fallback' },
        pdTerhapus.id
      )
      const aktif = await readSiteSettings(
        `inv-${suffix}`,
        { v: 'fallback' },
        pdAktif.id
      )

      expect(terhapus).toEqual({ v: 'fallback' })
      expect(aktif).toEqual({ v: 'aktif' })
    })
  })

  describe('satu pembalik yang disengaja', () => {
    it('membaca justru Struktur Terhapus, dan hanya itu', async () => {
      const rows = await readDeletedOrganizations({ id: orgIds })
      const ids = rows.map((r) => r.id)

      expect(ids).toContain(pdTerhapus.id)
      expect(ids).toContain(pwTerhapus.id)
      expect(ids).not.toContain(pdAktif.id)
      expect(ids).not.toContain(pdNonAktif.id)
    })

    it('membawa induk lama tiap baris, yang menentukan urutan pemulihan', async () => {
      const rows = await readDeletedOrganizations({ id: [pdTerhapus.id] })

      expect(rows[0].parentId).toBe(pw.id)
      expect(rows[0].state).toBe('terhapus')
    })
  })
})
