import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { inArray } from 'drizzle-orm'
import { db } from '~/db/db'
import { organization } from '~/db/schema/organization.sql'
import { member } from '~/db/schema/member.sql'
import {
  readOrganizationsByMemberTotal,
  type OrganizationKeysetCursor
} from '~/db/query/organization'

/**
 * Tiket 06 — keyset, bukan offset, untuk Daftar Struktur.
 *
 * Daftarnya diurut `total DESC, id ASC`, dan `total` berubah tiap ada Kader
 * masuk. Yang diuji di sini bukan sekadar "kembalikan beberapa baris" — itu
 * lolos oleh `LIMIT/OFFSET` juga. Yang diuji adalah invarian yang ditawarkan
 * keyset dan tidak ditawarkan offset: baris yang sudah dikirim di satu
 * halaman tidak pernah terkirim ulang di halaman berikutnya, walau posisi
 * baris lain berubah drastis di antara dua panggilan.
 */

const suffix = Date.now().toString(36)

const insertOrg = async (values: {
  name: string
  type: 'pp' | 'pw' | 'pd' | 'pdln' | 'pk'
  parentId: string | null
}) => {
  const [row] = await db
    .insert(organization)
    .values({
      name: values.name,
      slug: `${values.name.toLowerCase().replace(/\s+/g, '-')}-${suffix}`,
      code: `${values.name.toUpperCase().replace(/\s+/g, '-')}-${suffix}`,
      type: values.type,
      parentId: values.parentId
    })
    .returning({ id: organization.id, slug: organization.slug })
  return row
}

const insertMembers = async (
  organizationId: string,
  namePrefix: string,
  count: number,
  overrides: Partial<typeof member.$inferInsert> = {}
) => {
  if (count <= 0) return [] as string[]
  const rows = await db
    .insert(member)
    .values(
      Array.from({ length: count }, (_, i) => ({
        name: `${namePrefix} ${i} ${suffix}`,
        organizationId,
        registerNumber: `${namePrefix.replace(/\s+/g, '')}-${i}-${suffix}`,
        status: 'ab1' as const,
        gender: 'ikhwan' as const,
        yearOfEntry: 2024,
        isAlumn: false,
        isSuspended: false,
        isNonActive: false,
        ...overrides
      }))
    )
    .returning({ id: member.id })
  return rows.map((r) => r.id)
}

describe('readOrganizationsByMemberTotal — keyset', () => {
  let pw: { id: string; slug: string }
  // total: A=5, B=6, C=4, D=3, E=2
  let orgA: { id: string; slug: string }
  let orgB: { id: string; slug: string }
  let orgC: { id: string; slug: string }
  let orgD: { id: string; slug: string }
  let orgE: { id: string; slug: string }
  // PD dengan Komisariat di bawahnya — total harus menggulung Kader cucu.
  let pdRollup: { id: string; slug: string }
  let pkGrandchild: { id: string; slug: string }

  const orgIds: string[] = []
  const memberIds: string[] = []

  beforeAll(async () => {
    pw = await insertOrg({ name: `PW Keyset ${suffix}`, type: 'pw', parentId: null })
    orgIds.push(pw.id)

    orgA = await insertOrg({ name: `PD A ${suffix}`, type: 'pd', parentId: pw.id })
    orgB = await insertOrg({ name: `PD B ${suffix}`, type: 'pd', parentId: pw.id })
    orgC = await insertOrg({ name: `PD C ${suffix}`, type: 'pd', parentId: pw.id })
    orgD = await insertOrg({ name: `PD D ${suffix}`, type: 'pd', parentId: pw.id })
    orgE = await insertOrg({ name: `PD E ${suffix}`, type: 'pd', parentId: pw.id })
    orgIds.push(orgA.id, orgB.id, orgC.id, orgD.id, orgE.id)

    pdRollup = await insertOrg({
      name: `PD Rollup ${suffix}`,
      type: 'pd',
      parentId: pw.id
    })
    pkGrandchild = await insertOrg({
      name: `PK Rollup ${suffix}`,
      type: 'pk',
      parentId: pdRollup.id
    })
    orgIds.push(pdRollup.id, pkGrandchild.id)

    memberIds.push(...(await insertMembers(orgA.id, 'A', 5)))
    memberIds.push(...(await insertMembers(orgB.id, 'B', 6)))
    memberIds.push(...(await insertMembers(orgC.id, 'C', 4)))
    memberIds.push(...(await insertMembers(orgD.id, 'D', 3)))
    memberIds.push(...(await insertMembers(orgE.id, 'E', 2)))

    // 1 langsung di PD, 2 di cucu PK — total PD harus 3.
    memberIds.push(...(await insertMembers(pdRollup.id, 'Rollup PD', 1)))
    memberIds.push(...(await insertMembers(pkGrandchild.id, 'Rollup PK', 2)))
  })

  afterAll(async () => {
    if (memberIds.length)
      await db.delete(member).where(inArray(member.id, memberIds))
    await db.delete(organization).where(inArray(organization.id, orgIds))
  })

  it('mengurut anak langsung dengan total DESC lalu id ASC, dan menggulung total cucu ke induknya', async () => {
    const rows = await readOrganizationsByMemberTotal(
      { parentId: pw.id },
      { limit: 100 }
    )

    const byId = Object.fromEntries(rows.map((r) => [r.id, r]))
    expect(byId[orgA.id].total).toBe(5)
    expect(byId[orgB.id].total).toBe(6)
    expect(byId[orgC.id].total).toBe(4)
    expect(byId[orgD.id].total).toBe(3)
    expect(byId[orgE.id].total).toBe(2)
    // PD Rollup: 1 langsung + 2 dari PK Rollup di bawahnya.
    expect(byId[pdRollup.id].total).toBe(3)

    const ids = rows.map((r) => r.id)
    const expectedOrder = [orgB.id, orgA.id, orgC.id, pdRollup.id, orgD.id, orgE.id]
    // pdRollup dan orgD sama-sama total 3 — tie-break id ASC menentukan
    // urutan keduanya; yang pasti keduanya harus terurut berdampingan tepat
    // setelah orgC (total 4) dan sebelum orgE (total 2).
    const tieGroupExpected = [pdRollup.id, orgD.id].sort()
    const tieGroupActual = ids.slice(3, 5).sort()
    expect(tieGroupActual).toEqual(tieGroupExpected)
    expect(ids[0]).toBe(expectedOrder[0])
    expect(ids[1]).toBe(expectedOrder[1])
    expect(ids[2]).toBe(expectedOrder[2])
    expect(ids[5]).toBe(orgE.id)
  })

  it('halaman berurutan lewat cursor mencakup tiap baris tepat sekali, tanpa perubahan data di antaranya', async () => {
    const seen: string[] = []
    let cursor: OrganizationKeysetCursor | undefined
    let guard = 0

    while (guard < 10) {
      guard += 1
      const page = await readOrganizationsByMemberTotal(
        { parentId: pw.id },
        { limit: 2, cursor }
      )
      if (page.length === 0) break
      seen.push(...page.map((r) => r.id))
      const last = page[page.length - 1]
      cursor = { total: last.total, id: last.id }
      if (page.length < 2) break
    }

    expect(seen).toHaveLength(6)
    expect(new Set(seen).size).toBe(6)
    expect(seen).toContain(orgA.id)
    expect(seen).toContain(orgB.id)
    expect(seen).toContain(orgC.id)
    expect(seen).toContain(orgD.id)
    expect(seen).toContain(orgE.id)
    expect(seen).toContain(pdRollup.id)

    // Sudah habis — cursor terakhir tidak memunculkan baris lagi.
    const exhausted = await readOrganizationsByMemberTotal(
      { parentId: pw.id },
      { limit: 2, cursor }
    )
    expect(exhausted).toHaveLength(0)
  })

  it('menambah Kader di tengah penggiliran tidak membuat baris terlewat atau berganda', async () => {
    // Batch 1: limit 2 sebelum ada perubahan apa pun. Urutan awal:
    // B(6), A(5), C(4), rollup/D(3, seri), E(2).
    const batch1 = await readOrganizationsByMemberTotal(
      { parentId: pw.id },
      { limit: 2 }
    )
    expect(batch1.map((r) => r.id)).toEqual([orgB.id, orgA.id])
    const cursor: OrganizationKeysetCursor = {
      total: batch1[1].total,
      id: batch1[1].id
    }
    expect(cursor).toEqual({ total: 5, id: orgA.id })

    // Konkurensi: Kader baru masuk ke C persis di antara dua panggilan —
    // C melompat dari total 4 ke 7, melewati A dan B yang sudah terkirim di
    // batch1. Di bawah LIMIT/OFFSET, urutan baru [C7, B6, A5, rollup/D3...]
    // membuat OFFSET 2 (posisi lanjutan yang "seharusnya") mengembalikan
    // [A5, ...] lagi — A muncul dua kali. Keyset tidak menghitung posisi,
    // jadi ia tidak bisa jatuh ke jebakan yang sama.
    const extraMemberIds = await insertMembers(orgC.id, 'C Susulan', 3)
    memberIds.push(...extraMemberIds)

    const batch2 = await readOrganizationsByMemberTotal(
      { parentId: pw.id },
      { limit: 10, cursor }
    )
    const batch2Ids = batch2.map((r) => r.id)

    // Tidak ada baris dari batch1 yang terkirim ulang.
    expect(batch2Ids).not.toContain(orgA.id)
    expect(batch2Ids).not.toContain(orgB.id)

    // C sekarang total 7 (di atas cursor.total=5) — ia sudah "seharusnya"
    // muncul sebelum cursor, tapi datang terlambat. Keyset sengaja tidak
    // menariknya mundur ke halaman ini; ia bukan baris yang terlewat, ia
    // baris yang berubah setelah jendelanya lewat. Yang wajib benar adalah
    // ia tidak pernah dobel, dan itu diperiksa di atas untuk A & B — C
    // sendiri boleh absen di sini karena predikatnya (total < 5) memang
    // tidak lagi mencakupnya.
    expect(batch2Ids).not.toContain(orgC.id)

    // D, E, dan PD Rollup — tak tersentuh oleh susulan di C — tetap muncul
    // tepat sekali, dalam urutan total DESC, id ASC.
    expect(new Set(batch2Ids).size).toBe(batch2Ids.length)
    expect(batch2Ids).toContain(orgD.id)
    expect(batch2Ids).toContain(orgE.id)
    expect(batch2Ids).toContain(pdRollup.id)
    expect(batch2Ids).toHaveLength(3)
  })

  it('menyaring total lewat isAlumn, konsisten dengan readMemberAggregates', async () => {
    const orgAlumni = await insertOrg({
      name: `PD Alumni ${suffix}`,
      type: 'pd',
      parentId: pw.id
    })
    orgIds.push(orgAlumni.id)
    memberIds.push(
      ...(await insertMembers(orgAlumni.id, 'Aktif', 2, { isAlumn: false }))
    )
    memberIds.push(
      ...(await insertMembers(orgAlumni.id, 'Alumni', 3, { isAlumn: true }))
    )

    const [aktifOnly] = await readOrganizationsByMemberTotal(
      { parentId: pw.id, name: 'Alumni', isAlumn: false },
      { limit: 1 }
    )
    const [alumniOnly] = await readOrganizationsByMemberTotal(
      { parentId: pw.id, name: 'Alumni', isAlumn: true },
      { limit: 1 }
    )

    expect(aktifOnly.total).toBe(2)
    expect(alumniOnly.total).toBe(3)
  })
})
