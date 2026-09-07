import { z } from 'zod'

/**
 * Spasi, tanda hubung, dan tanda kurung dibuang sebelum aturan format
 * dijalankan (ADR-0026) — mereka tidak mengubah arti nomor, hanya cara
 * orang mengetiknya.
 */
const SEPARATOR_RE = /[\s\-()]/g

const stripSeparators = (raw: string): string =>
  raw.trim().replace(SEPARATOR_RE, '')

/**
 * Mengubah apa pun yang diketik pengguna menjadi kandidat E.164 — ADR-0026.
 * Karakter pertama (sesudah pemisah dibuang) yang menentukan kode negara:
 * `+` atau `00` dipercaya apa adanya, selain itu dianggap Indonesia dan
 * dinormalisasi jadi `+62…`.
 *
 * Murni dan total: tidak pernah melempar, tidak memvalidasi bentuknya
 * (lihat `phoneFormField` untuk itu) — hanya menerka kode negara dari
 * karakter pertama. String kosong/hanya-spasi kembali sebagai `''` supaya
 * pemanggil bisa memperlakukan "tidak ada nomor" secara seragam.
 *
 * Ini SATU-SATUNYA fungsi normalisasi — `phoneFormField` di bawah (dipakai
 * kelima pintu masuk), backfill (`src/db/scripts/backfill-phone-e164.ts`),
 * dan tampilan (`profile-info.tsx`) semuanya memanggil lewat sini supaya
 * aturannya tidak bisa diam-diam bercabang.
 */
export const normalizePhoneToE164 = (raw: string): string => {
  const stripped = stripSeparators(raw)
  if (stripped === '') return ''
  if (stripped.startsWith('+')) return stripped
  if (stripped.startsWith('00')) return `+${stripped.slice(2)}`
  if (stripped.startsWith('62')) return `+${stripped}`
  if (stripped.startsWith('0')) return `+62${stripped.slice(1)}`
  return `+62${stripped}`
}

// Sesudah +62, harus mulai 8, lalu 8-11 digit lagi — total digit lokal
// (termasuk 8 di depan) 9-13 digit.
const INDONESIA_E164_RE = /^\+628[0-9]{8,12}$/

// Bentuk E.164 umum: '+' lalu digit 1-9 lalu 7-14 digit lagi — total digit
// (tanpa '+') 8-15, tanpa pustaka tambahan.
const FOREIGN_E164_RE = /^\+[1-9][0-9]{7,14}$/

const INDONESIA_MESSAGE =
  'Nomor Indonesia harus diawali 8 setelah kode negara +62 (contoh: +628123456789), dengan panjang 9–13 digit.'

const FOREIGN_MESSAGE =
  'Nomor tidak sesuai format internasional E.164 — total 8–15 digit setelah tanda +.'

/**
 * Field Zod untuk `phone` — dipakai kelima pintu masuk (ADR-0026):
 * `kader/_components/add-form`, `trainings/_components/training-detail-view`,
 * `profile/[registerNumber]/_components/action`, dan
 * `kader/_components/bulk-upload`. Menormalisasi lewat
 * `normalizePhoneToE164`, lalu memvalidasi tidak sama rata: nomor Indonesia
 * (`+62…`) diperiksa ketat, nomor asing hanya diperiksa bentuk E.164 umum.
 * Kolom kosong (`''`, `null`, `undefined`) selalu sah.
 */
export const phoneFormField = z
  .preprocess((value) => {
    if (typeof value !== 'string') return value
    return normalizePhoneToE164(value)
  }, z.string().optional().nullable())
  .superRefine((value, ctx) => {
    if (!value) return

    if (value.startsWith('+62')) {
      if (!INDONESIA_E164_RE.test(value)) {
        ctx.addIssue({ code: 'custom', message: INDONESIA_MESSAGE })
      }
      return
    }

    if (!FOREIGN_E164_RE.test(value)) {
      ctx.addIssue({ code: 'custom', message: FOREIGN_MESSAGE })
    }
  })

// Nomor lama yang aman dikonversi tanpa menebak (ADR-0026 — Backfill): sudah
// bebas pemisah, dan setelahnya berbentuk "08…"/"8…" atau "628…" murni digit.
// Apa pun di luar ini (kode negara asing, `062…` ganda, sisa karakter aneh)
// tidak cocok, dan idempotensinya berasal dari sini: begitu sebuah baris
// sudah menjadi `+628…`, awalan `+`-nya membuat regex ini tidak pernah cocok
// lagi, jadi baris yang sudah dikonversi tidak pernah disentuh ulang.
const BACKFILL_SAFE_RE = /^(0?8[0-9]{8,11}|628[0-9]{8,11})$/

/**
 * Memutuskan apakah nilai `member.phone` lama aman dikonversi ke E.164 tanpa
 * kehilangan informasi (ADR-0026 — Backfill). Mengembalikan nilai E.164
 * barunya bila aman, atau `null` bila baris harus dibiarkan utuh — dipanggil
 * dari `src/db/scripts/backfill-phone-e164.ts`.
 */
export const decideBackfillPhone = (rawPhone: string): string | null => {
  const stripped = stripSeparators(rawPhone)
  if (!BACKFILL_SAFE_RE.test(stripped)) return null
  return normalizePhoneToE164(stripped)
}

/**
 * Digit string `wa.me` wants — E.164 without the leading `+` (ADR-0026,
 * Consequences). Named on purpose rather than left as an inline
 * `normalizePhoneToE164(...).replace(...)` chain at each call site: the
 * transform is a WhatsApp-specific concern, and giving it its own name keeps
 * that concern out of the caller.
 */
export const toWaMeDigits = (phone: string): string =>
  normalizePhoneToE164(phone).replace(/^\+/, '')
