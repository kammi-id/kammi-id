import { sql, eq } from 'drizzle-orm'
import { db } from '../db'
import { type DBExecutor } from '../types'
import { user as userTable } from '../schema/user.sql'
import { isOrgInAccessScope, type AccessScope } from './organization'
import { deleteSessionsByUser } from './session'
import { generatePassword, hashPassword } from '~/lib/utils/user'

/**
 * Tiket 06 — regenerasi kredensial massal. Satu-satunya bagian dari fitur ini
 * yang menyentuh basis data; kewenangan (Root/BPK, bukan BPH) dan tiga lapis
 * konfirmasi (jumlah terhitung, kode Struktur, password pengurus) adalah
 * urusan Server Action yang memanggilnya.
 */

type ResettableAccountRow = {
  userId: string
  name: string
  registerNumber: string
}

/**
 * `org_tree` yang sama bentuknya dengan `readDescendantMembers`
 * (`src/db/query/member.ts`) dan `resetOrganizationAccount`
 * (`src/db/query/organization-account-reset.ts`): sasaran plus seluruh
 * turunannya, `deleted_at IS NULL` di kedua kaki supaya Struktur Terhapus
 * tidak pernah muncul sebagai turunan yang "masih ada".
 *
 * Hanya `role = 'member'` — Akun Kepengurusan punya jalur reset sendiri (ADR
 * 0011, `requireOrganizationAccountResetAccess`) dan tidak pernah tersentuh
 * di sini.
 */
const readResettableAccounts = async (
  executor: DBExecutor,
  organizationId: string
): Promise<ResettableAccountRow[]> => {
  const rows = await executor.execute(sql`
    WITH RECURSIVE org_tree AS (
      SELECT id FROM organization
      WHERE id = ${organizationId} AND deleted_at IS NULL
      UNION ALL
      SELECT o.id FROM organization o
      JOIN org_tree ot ON o.parent_id = ot.id
      WHERE o.deleted_at IS NULL
    )
    SELECT u.id AS "userId", m.name AS "name", u.name AS "registerNumber"
    FROM "user" u
    JOIN member m ON m.id = u.connected_member_id
    WHERE m.organization_id IN (SELECT id FROM org_tree)
      AND u.role = 'member'
      AND u.deleted_at IS NULL
      AND m.deleted_at IS NULL
  `)

  return rows as unknown as ResettableAccountRow[]
}

/**
 * Jumlah **terhitung** — bukan diperkirakan — Akun Kader yang akan tersentuh
 * kalau `resetMassMemberCredentials` dipanggil untuk `organizationId` yang
 * sama saat ini. Dipakai lapis pertama dari tiga lapis konfirmasi (spec
 * tiket 06 §"Tiga lapis konfirmasi").
 */
export const countMassResettableMemberAccounts = async (
  organizationId: string
): Promise<number> => {
  const rows = await readResettableAccounts(db, organizationId)
  return rows.length
}

export type MassCredentialResetRow = {
  name: string
  registerNumber: string
  password: string
}

/**
 * Menerbitkan ulang password setiap Akun Kader di bawah `organizationId` dan
 * turunannya, memutus seluruh sesi masing-masing, lalu mengembalikan
 * plaintext-nya sekali — satu-satunya kesempatan ia terlihat (ADR 0028).
 *
 * **Cakupan divalidasi ulang di sini**, bukan hanya dipercaya dari pemanggil
 * (`Cakupan wajib jadi argumen`, AGENTS.md) — tapi **di luar** transaksi:
 * `isOrgInAccessScope` memakai `db` biasa, bukan `tx`, dan memanggilnya dari
 * dalam `db.transaction` berebut satu-satunya koneksi yang sedang dipegang
 * transaksi itu sendiri (`src/db/db.ts`, pool `max: 1` di tes) — deadlock,
 * bukan sekadar lambat. Menolaknya di sini tetap memenuhi "nol baris berubah
 * kalau ditolak": belum ada `db.transaction` yang dimulai sama sekali.
 *
 * **Satu transaksi untuk seluruh mutasinya.** Kegagalan di tengah loop (mis.
 * `hashPassword` galat) membatalkan seluruh transaksi lewat rollback Postgres
 * alih-alih meninggalkan sebagian Akun dengan password baru dan sisanya
 * dengan yang lama.
 *
 * `deleteSessionsByUser` dipanggil per akun dengan `tx` yang sama — bukan
 * `db` default-nya — supaya pemutusan sesi itu benar-benar bagian dari
 * transaksi ini alih-alih commit sendiri di koneksi lain.
 */
export const resetMassMemberCredentials = async (
  organizationId: string,
  scope: AccessScope
): Promise<MassCredentialResetRow[]> => {
  const inScope = await isOrgInAccessScope(scope, organizationId)
  if (!inScope) {
    throw new Error('Struktur sasaran di luar Cakupan pemanggil')
  }

  return await db.transaction(async (tx) => {
    // Mengunci baris Struktur sasaran: mencegah ia dihapus di antara
    // pemeriksaan Cakupan di atas dan pembacaan turunannya di bawah.
    const targetRows = await tx.execute(sql`
      SELECT id FROM organization
      WHERE id = ${organizationId} AND deleted_at IS NULL
      FOR UPDATE
    `)
    if (targetRows.length === 0) {
      throw new Error('Struktur sasaran tidak ditemukan')
    }

    const accounts = await readResettableAccounts(tx, organizationId)

    // Hashing (CPU-bound, Argon2id) dijalankan lebih dulu dan sekaligus —
    // ia tidak menyentuh koneksi database sama sekali, jadi tidak ada
    // alasan menahannya di belakang tiap `UPDATE` yang serial di satu
    // koneksi (`src/db/db.ts`, pool `max: 1` di tes).
    const withNewPassword = await Promise.all(
      accounts.map(async (account) => {
        const password = generatePassword()
        const passwordHash = await hashPassword(password)
        return { ...account, password, passwordHash }
      })
    )

    const results: MassCredentialResetRow[] = []
    for (const account of withNewPassword) {
      await tx
        .update(userTable)
        .set({ passwordHash: account.passwordHash })
        .where(eq(userTable.id, account.userId))

      await deleteSessionsByUser(account.userId, undefined, tx)

      results.push({
        name: account.name,
        registerNumber: account.registerNumber,
        password: account.password
      })
    }

    return results
  })
}
