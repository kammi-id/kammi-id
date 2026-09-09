import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { inArray } from 'drizzle-orm'
import { db } from '../db'
import { organization } from '../schema/organization.sql'
import { member } from '../schema/member.sql'
import { backfillPhoneE164 } from './backfill-phone-e164'

/**
 * Tiket 04 (ADR-0026) — backfill nomor kontak lama ke E.164. Fixture
 * bersufiks, dibereskan sendiri lewat `afterAll` (mengikuti pola
 * `src/db/query/member.test.ts`) — bukan TRUNCATE, supaya tidak menabrak
 * berkas tes lain yang berjalan di worktree paralel.
 */
describe('backfillPhoneE164', () => {
  const suffix = Date.now().toString(36)
  let orgId: string
  const memberIds: string[] = []

  const seedMember = async (
    label: string,
    phone: string | null
  ): Promise<string> => {
    const [row] = await db
      .insert(member)
      .values({
        name: `Kader Backfill ${label} ${suffix}`,
        registerNumber: `RN-BF-${suffix}-${label}`,
        organizationId: orgId,
        status: 'ab1',
        gender: 'ikhwan',
        yearOfEntry: 2026,
        phone
      })
      .returning({ id: member.id })
    memberIds.push(row.id)
    return row.id
  }

  const readPhone = async (id: string): Promise<string | null> => {
    const [row] = await db
      .select({ phone: member.phone })
      .from(member)
      .where(inArray(member.id, [id]))
    return row?.phone ?? null
  }

  beforeAll(async () => {
    const [org] = await db
      .insert(organization)
      .values({
        name: `Org Backfill ${suffix}`,
        slug: `org-backfill-${suffix}`,
        code: `OBF-${suffix}`,
        type: 'pw',
        parentId: null,
        isNonActive: false
      })
      .returning({ id: organization.id })
    orgId = org.id
  })

  afterAll(async () => {
    if (memberIds.length > 0)
      await db.delete(member).where(inArray(member.id, memberIds))
    await db.delete(organization).where(inArray(organization.id, [orgId]))
  })

  it('mengonversi baris aman dan tidak menyentuh baris cacat', async () => {
    const safeLeadingZero = await seedMember('safe-0', '08123456789')
    const safeBare8 = await seedMember('safe-8', '8123456789')
    const safe62 = await seedMember('safe-62', '628123456789')
    const safeWithDashes = await seedMember('safe-dash', '0812-3456-6710')

    const foreign = await seedMember('foreign', '+971501234567')
    const double062 = await seedMember('double-062', '0628123456789')
    const junk = await seedMember('junk', '-')
    const empty = await seedMember('empty', '')
    const nullPhone = await seedMember('null', null)

    const result = await backfillPhoneE164()

    expect(result.converted).toBeGreaterThanOrEqual(4)

    expect(await readPhone(safeLeadingZero)).toBe('+628123456789')
    expect(await readPhone(safeBare8)).toBe('+628123456789')
    expect(await readPhone(safe62)).toBe('+628123456789')
    expect(await readPhone(safeWithDashes)).toBe('+6281234566710')

    // Cacat/asing/kosong dibiarkan utuh — tidak pernah di-null-kan, tidak
    // pernah ditebak.
    expect(await readPhone(foreign)).toBe('+971501234567')
    expect(await readPhone(double062)).toBe('0628123456789')
    expect(await readPhone(junk)).toBe('-')
    expect(await readPhone(empty)).toBe('')
    expect(await readPhone(nullPhone)).toBeNull()
  })

  it('idempoten: menjalankan dua kali tidak mengubah apa pun pada percobaan kedua', async () => {
    const safe = await seedMember('idem', '081234567890')

    const first = await backfillPhoneE164()
    expect(first.converted).toBeGreaterThanOrEqual(1)
    const afterFirst = await readPhone(safe)
    expect(afterFirst).toBe('+6281234567890')

    const second = await backfillPhoneE164()
    const afterSecond = await readPhone(safe)

    expect(afterSecond).toBe(afterFirst)
    // Baris ini sendiri tidak lagi cocok pola aman pada percobaan kedua —
    // pastikan panggilan kedua tidak menghitungnya lagi.
    expect(second.converted).toBe(0)
  })
})
