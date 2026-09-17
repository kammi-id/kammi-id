import {
  createSession as createSessionFromTable,
  readSession as readSessionFromTable,
  updateSession as updateSessionFromTable,
  deleteSession as deleteSessionFromTable
} from '~/db/query/session'
import { mayHoldSession } from './keadaan-akun'
import { type Session } from '~/db/query/cte/session'
import z from 'zod'

const inactivityTimeoutMS = 1000 * 60 * 60 * 24 * 3
const activityCheckIntervalMS = 1000 * 60 * 60 * 6

/**
 * Keadaan Akun, spec §5.2. **The seam is here and nowhere else** — every
 * `if (!session) redirect('/login')` already scattered across pages and Server
 * Actions inherits it unchanged, and surfaces not yet written inherit it too,
 * because they must come through here as well.
 *
 * `readAccessScope` was rejected as the seam: a Server Action that does not use
 * it walks straight past. The dashboard layout and `AccessGuard` were rejected
 * harder — both close a **page**, while a Server Action can be invoked directly
 * without rendering one.
 *
 * The door shuts on the **next request**, not the next login. `maxAge` is three
 * days, and three days of a dead Struktur still recording Kader is exactly what
 * deactivating it was meant to stop. Nothing is deleted, so reactivating the
 * Struktur opens the same session again without anyone logging back in.
 *
 * Both readers below run through it. `readSession` has no caller today, and
 * that is precisely why it is gated rather than trusted: an exported door left
 * ungated is the "jalur-yang-bisa-lupa-dipanggil" the spec rejected an
 * alternative seam for being.
 */
/**
 * Sliding expiry, and it lives here because **the cookie cannot enforce it**.
 * `maxAge` binds an honest browser and nothing else: a token lifted out of one
 * is a plain string, and until this check existed on both readers no code path
 * ever rejected a session for age. A row in `session` was valid forever.
 *
 * Which is also why turning it on evicts nobody. The cookie is written once at
 * login with a 3-day `maxAge` and never refreshed, so `lastVerifiedAt` — which
 * starts at that same login and only moves forward — can never be 3 days stale
 * while the cookie that carries it is still alive. For a browser this is dead
 * weight; for a leaked token it is the only door.
 */
const hasIdledOut = (session: { lastVerifiedAt: Date }, now: Date) =>
  now.getTime() - session.lastVerifiedAt.getTime() >= inactivityTimeoutMS

const ifAkunMayHoldIt = (session: Session | undefined) => {
  if (!session) return undefined

  // Lapis 1 (ADR 0021): `deleteMember` now soft-deletes the connected `user`
  // row instead of discarding it, so the `session` row this Akun already
  // holds no longer dies with it by cascade. Checked here, not folded into
  // `mayHoldSession`, because it is a fact about the Akun's own row — not a
  // Keadaan derived from its Struktur, which is the only thing that pure
  // function answers.
  if (session.user.deletedAt) return undefined

  return mayHoldSession(
    session.user.role,
    session.user.connectedOrganization?.state ?? null
  )
    ? session
    : undefined
}

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
  if (hasIdledOut(session, now)) {
    await deleteSession([session.id])
    return undefined
  }

  return ifAkunMayHoldIt(session)
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

  const [session] = await readSessionFromTable([validatedToken.data.id])
  if (!session) {
    return undefined
  }

  const secretHash = hashSecret(validatedToken.data.secret)
  const isSecretValid = constantTimeEqual(secretHash, session.secretHash)
  if (!isSecretValid) {
    return undefined
  }

  const now = new Date()

  // Asked **after** the secret, not before: an id alone must never be enough to
  // make this reader delete a row. Asked **before** the refresh below for the
  // same reason it exists at all — refreshing first would renew the very
  // session this is meant to retire.
  if (hasIdledOut(session, now)) {
    await deleteSession([session.id])
    return undefined
  }

  if (
    now.getTime() - session.lastVerifiedAt.getTime() >=
    activityCheckIntervalMS
  ) {
    const [updatedSession] = await updateSessionFromTable(
      { lastVerifiedAt: now },
      session.id
    )
    return ifAkunMayHoldIt(updatedSession)
  }

  return ifAkunMayHoldIt(session)
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
