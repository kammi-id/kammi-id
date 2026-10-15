import { eq, isNotNull } from 'drizzle-orm'
import { db } from '../db'
import { member } from '../schema/member.sql'
import { decideBackfillPhone } from '~/lib/validation/phone'

export type BackfillPhoneResult = {
  scanned: number
  converted: number
}

/**
 * Konversi `member.phone` lama ke E.164 untuk baris yang aman dikonversi
 * tanpa menebak (ADR-0026 — Backfill). `decideBackfillPhone` memutuskan per
 * baris; baris yang dikembalikannya `null` (nomor asing, `062…` ganda, sisa
 * karakter aneh) dibiarkan utuh — tidak pernah di-null-kan, tidak pernah
 * ditebak.
 *
 * Idempoten secara alami: begitu sebuah baris sudah menjadi `+628…`, awalan
 * `+`-nya tidak lagi cocok dengan pola aman `decideBackfillPhone` pakai,
 * jadi menjalankan ini dua kali pada baris yang sama tidak melakukan apa-apa
 * pada percobaan kedua.
 */
export const backfillPhoneE164 = async (): Promise<BackfillPhoneResult> => {
  const rows = await db
    .select({ id: member.id, phone: member.phone })
    .from(member)
    .where(isNotNull(member.phone))

  let converted = 0

  for (const row of rows) {
    if (!row.phone) continue

    const next = decideBackfillPhone(row.phone)
    if (next === null || next === row.phone) continue

    await db.update(member).set({ phone: next }).where(eq(member.id, row.id))
    converted++
  }

  return { scanned: rows.length, converted }
}

if (import.meta.main) {
  const result = await backfillPhoneE164()
  console.log(
    `Backfill nomor kontak selesai: ${result.converted}/${result.scanned} baris dikonversi ke E.164.`
  )
}
