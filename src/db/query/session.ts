import { db } from '../db'
import { session } from '../schema/session.sql'
import { inArray, eq } from 'drizzle-orm'

type Session = typeof session.$inferSelect
type SessionInsertValues = typeof session.$inferInsert

export const createSession = async (
  values: SessionInsertValues
): Promise<Array<Session>> => {
  return await db.insert(session).values(values).returning()
}

export const readSession = async (
  id: Array<string>
): Promise<Array<Session>> => {
  return await db.select().from(session).where(inArray(session.id, id))
}

export const updateSession = async (
  values: Partial<Pick<SessionInsertValues, 'lastVerifiedAt'>>,
  id: string
) => {
  return await db
    .update(session)
    .set(values)
    .where(eq(session.id, id))
    .returning()
}

export const deleteSession = async (id: Array<string>): Promise<void> => {
  await db.delete(session).where(inArray(session.id, id))
}
