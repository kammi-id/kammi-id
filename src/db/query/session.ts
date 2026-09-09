import { db } from '../db'
import { session } from '../schema/session.sql'
import { withSessionCTE, type Session } from './cte/session'
import { inArray, eq, and, ne } from 'drizzle-orm'

type SessionInsertValues = typeof session.$inferInsert

export const createSession = async (
  values: SessionInsertValues
): Promise<Array<Session>> => {
  return await db.transaction(async (tx) => {
    const [newSession] = await tx
      .insert(session)
      .values(values)
      .returning({ id: session.id })

    return await tx
      .with(withSessionCTE)
      .select()
      .from(withSessionCTE)
      .where(inArray(withSessionCTE.id, [newSession.id]))
  })
}

export const readSession = async (
  id: Array<string>
): Promise<Array<Session>> => {
  return await db
    .with(withSessionCTE)
    .select()
    .from(withSessionCTE)
    .where(inArray(withSessionCTE.id, id))
}

export const updateSession = async (
  values: Partial<Pick<SessionInsertValues, 'lastVerifiedAt'>>,
  id: string
): Promise<Array<Session>> => {
  return await db.transaction(async (tx) => {
    await tx.update(session).set(values).where(eq(session.id, id))

    return await tx
      .with(withSessionCTE)
      .select()
      .from(withSessionCTE)
      .where(inArray(withSessionCTE.id, [id]))
  })
}

export const deleteSession = async (id: Array<string>): Promise<void> => {
  await db.delete(session).where(inArray(session.id, id))
}

/**
 * Memutus seluruh sesi hidup seorang pengguna — separuh "reset password
 * mematikan sesi yang hidup" dari ADR 0028. Satu `DELETE`, bukan pembacaan
 * lalu `deleteSession`: yang dituju adalah *semua*, dan membacanya lebih dulu
 * hanya menambah jendela tempat sesi baru bisa lolos.
 *
 * `exceptSessionId` menyelamatkan tepat satu sesi, dan ada untuk satu
 * pemanggil saja — Kader yang mengganti password sendiri dan tidak boleh
 * menendang dirinya keluar di tengah aksinya. Reset oleh pengurus memanggilnya
 * tanpa argumen kedua. Pengecualiannya tetap terikat `user_id`, jadi id milik
 * pengguna lain tidak menyelamatkan apa pun dan tidak pula memperluas
 * jangkauan hapusnya.
 */
export const deleteSessionsByUser = async (
  userId: string,
  exceptSessionId?: string
): Promise<void> => {
  const scope = eq(session.userId, userId)

  await db
    .delete(session)
    .where(
      exceptSessionId ? and(scope, ne(session.id, exceptSessionId)) : scope
    )
}
