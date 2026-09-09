import { db } from '../db'
import { session } from '../schema/session.sql'
import { withSessionCTE, type Session } from './cte/session'
import { inArray, eq } from 'drizzle-orm'

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
