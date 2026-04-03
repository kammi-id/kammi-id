import { getSession as getDBSession } from '~/db/query/session'
import {
  createSession as createDBSession,
  updateSession as updateDBSession,
  deleteSession as deleteDBSession
} from '~/db/mutations/session'
import { timingSafeEqual } from 'node:crypto'
import { type WithError } from '~/lib/helper/with-error'
import z from 'zod'

const INACTIVITY_TIMEOUT_MS = 1000 * 60 * 60 * 24 // 1 day
const ACTIVITY_CHECK_INTERVAL_MS = 1000 * 60 * 60 * 3 // 3 hrs

type Session = NonNullable<Awaited<ReturnType<typeof getDBSession>>[1]>[number]
type SessionWithToken = Session & { token: string }

/**
 * Retrieves a session by ID and performs an inactivity check.
 * If the session is older than `INACTIVITY_TIMEOUT_MS`, it is deleted.
 *
 * @param id - The session ID (UUIDv7).
 * @returns A tuple [Error, Session] where Error is present if the retrieval or check fails.
 */
export const getSession = async (id: string): Promise<WithError<Session>> => {
  const [error, sessions] = await getDBSession({ id })
  if (error) {
    if (error instanceof Error) {
      return [error, undefined]
    }
    return [new Error('Terjadi masalah saat mengambil sesi Anda'), undefined]
  }

  if (sessions.length !== 1) {
    return [new Error('Terjadi masalah saat mengambil sesi Anda'), undefined]
  }

  const [session] = sessions
  const now = Date.now()
  if (now - session.lastVerifiedAt >= INACTIVITY_TIMEOUT_MS) {
    const [deleteError] = await deleteSession(session.id)
    if (deleteError) {
      return [deleteError, undefined]
    }

    return [new Error('Sesi Anda telah berakhir.'), undefined]
  }

  return [undefined, session]
}

/**
 * Creates a new session for a user.
 * Generates a unique ID (UUIDv7) and a secret token (UUIDv4).
 * The secret is hashed before being stored in the database.
 *
 * @param userId - The ID of the user for whom the session is created.
 * @returns A tuple [Error, SessionWithToken] containing the session data and the plain-text token.
 */
export const createSession = async (
  userId: string
): WithError<SessionWithToken> => {
  const id = Bun.randomUUIDv7()
  const secret = crypto.randomUUID()
  const secretHash = hashSecret(secret)
  const token = [id, secret].join('.')
  const createdAt = Date.now()

  const [createError, sessions] = await createDBSession([
    {
      id,
      secretHash,
      userId,
      createdAt,
      lastVerifiedAt: createdAt
    }
  ])

  if (createError) {
    return [createError, undefined]
  }

  if (sessions.length !== 1) {
    return [new Error('Terjadi masalah saat membuat sesi Anda'), undefined]
  }

  const [session] = sessions
  return [undefined, { ...session, token }]
}

/**
 * Validates a session token (composite string: ID.Secret).
 * Performs format validation, database lookup, secret comparison, and a 3-hour activity update check.
 *
 * @param token - The raw session token from the client.
 * @returns A tuple [Error, Session] if the token is valid and active.
 */
export const validateSession = async (token: string): WithError<Session> => {
  const [id, secret] = token.split('.')

  if (!secret) {
    return [new Error('Sesi tidak valid.'), undefined]
  }

  const tokenValidator = z
    .tuple([z.uuidv7(), z.uuidv4()])
    .safeParse([id, secret])

  if (!tokenValidator.success) {
    return [new Error('Sesi tidak valid.'), undefined]
  }

  const [validId, validSecret] = tokenValidator.data
  const [sessionError, session] = await getSession(validId)
  if (sessionError) {
    return [sessionError, undefined]
  }

  const secretHash = hashSecret(validSecret)
  const isTokenSecretValid = compareHash(session.secretHash, secretHash)
  if (!isTokenSecretValid) {
    return [new Error('Sesi tidak valid.'), undefined]
  }

  const now = Date.now()
  if (now - session.lastVerifiedAt >= ACTIVITY_CHECK_INTERVAL_MS) {
    const [updateError] = await updateDBSession(session.id, {
      lastVerifiedAt: now
    })
    if (updateError) {
      return [updateError, undefined]
    }

    session.lastVerifiedAt = now
  }

  return [undefined, session]
}

/**
 * Deletes a session from the database.
 *
 * @param id - The ID of the session to be deleted.
 * @returns A tuple [Error, void] indicating success or failure.
 */
export const deleteSession = async (id: string): WithError<void> => {
  return await deleteDBSession([id])
}

const hashSecret = (secret: string): string => {
  const hasher = new Bun.CryptoHasher('sha256')
  hasher.update(secret)

  return hasher.digest('hex')
}

const compareHash = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)

  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}
