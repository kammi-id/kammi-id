import {
  createSession as createSessionFromTable,
  readSession as readSessionFromTable,
  updateSession as updateSessionFromTable,
  deleteSession as deleteSessionFromTable
} from '~/db/query/session'
import z from 'zod'

const inactivityTimeoutMS = 1000 * 60 * 60 * 24 * 3
const activityCheckIntervalMS = 1000 * 60 * 60 * 6

export const createSession = async (userId: string) => {
  const id = Bun.randomUUIDv7()
  const secret = crypto.randomUUID()
  const secretHash = hashSecret(secret)
  const now = new Date()
  const token = [id, secret].join('.')

  const [session] = await createSessionFromTable({
    id,
    secretHash,
    createdAt: now,
    lastVerifiedAt: now,
    userId
  })

  if (!session) {
    return undefined
  }

  return {
    ...session,
    token
  }
}

export const readSession = async (id: string) => {
  const [session] = await readSessionFromTable([id])
  if (!session) {
    return undefined
  }

  const now = new Date()
  if (now.getTime() - session.lastVerifiedAt.getTime() >= inactivityTimeoutMS) {
    await deleteSession([session.id])
    return undefined
  }

  return session
}

export const validateSession = async (token: string) => {
  const [id, secret] = token.split('.')

  const validatedToken = z
    .object({
      id: z.uuidv7(),
      secret: z.uuidv4()
    })
    .safeParse({ id, secret })

  if (!validatedToken.success) {
    return undefined
  }

  const session = await readSession(validatedToken.data.id)
  if (!session) {
    return undefined
  }

  const secretHash = hashSecret(validatedToken.data.secret)
  const isSecretValid = constantTimeEqual(secretHash, session.secretHash)
  if (!isSecretValid) {
    return undefined
  }

  const now = new Date()
  if (
    now.getTime() - session.lastVerifiedAt.getTime() >=
    activityCheckIntervalMS
  ) {
    const [updatedSession] = await updateSessionFromTable(
      { lastVerifiedAt: now },
      session.id
    )
    return updatedSession
  }

  return session
}

export const deleteSession = async (
  ...args: Parameters<typeof deleteSessionFromTable>
): Promise<void> => {
  await deleteSessionFromTable(...args)
}

const hashSecret = (secret: string): string => {
  const hasher = new Bun.CryptoHasher('sha256')
  hasher.update(secret)

  return hasher.digest('base64')
}

const constantTimeEqual = (a: string, b: string): boolean => {
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)

  if (aBytes.byteLength !== bBytes.byteLength) {
    return false
  }

  return crypto.timingSafeEqual(aBytes, bBytes)
}
