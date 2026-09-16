import { and, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm'
import { db } from '../db'
import {
  verificationAccessLog,
  verificationKey,
  verificationRateWindow
} from '../schema/verification-key.sql'

const hashSecret = (secret: string): string => {
  const hasher = new Bun.CryptoHasher('sha256')
  hasher.update(secret)
  return hasher.digest('base64')
}

const createSecret = (): string =>
  `kv_${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`

export const createVerificationKey = async (): Promise<string> => {
  const secret = createSecret()
  await db.insert(verificationKey).values({ secretHash: hashSecret(secret) })
  return secret
}

export const readVerificationKeys = async () =>
  await db
    .select({
      id: verificationKey.id,
      createdAt: verificationKey.createdAt,
      lastUsedAt: verificationKey.lastUsedAt,
      revokedAt: verificationKey.revokedAt
    })
    .from(verificationKey)
    .orderBy(desc(verificationKey.createdAt))

export const revokeVerificationKey = async (id: string): Promise<void> => {
  await db
    .update(verificationKey)
    .set({ revokedAt: new Date() })
    .where(and(eq(verificationKey.id, id), isNull(verificationKey.revokedAt)))
}

export const authenticateVerificationKey = async (secret: string) => {
  const [key] = await db
    .select()
    .from(verificationKey)
    .where(
      and(
        eq(verificationKey.secretHash, hashSecret(secret)),
        isNull(verificationKey.revokedAt)
      )
    )
    .limit(1)
  return key ?? null
}

export const consumeVerificationRateLimit = async (
  keyId: string,
  now = new Date()
): Promise<boolean> => {
  const windowStartedAt = new Date(now)
  windowStartedAt.setSeconds(0, 0)

  const rows = await db
    .insert(verificationRateWindow)
    .values({ keyId, windowStartedAt })
    .onConflictDoUpdate({
      target: [
        verificationRateWindow.keyId,
        verificationRateWindow.windowStartedAt
      ],
      set: { requestCount: sql`${verificationRateWindow.requestCount} + 1` },
      where: lt(verificationRateWindow.requestCount, 60)
    })
    .returning({ id: verificationRateWindow.id })

  return rows.length === 1
}

export const recordVerificationAccess = async ({
  keyId,
  outcome,
  reason
}: {
  keyId: string | null
  outcome: 'found' | 'not_found' | 'unauthorized' | 'rate_limited'
  reason?: 'invalid_key' | 'not_found' | 'not_verifiable' | 'rate_limited'
}): Promise<void> => {
  await db.insert(verificationAccessLog).values({ keyId, outcome, reason })

  const retentionStart = new Date()
  retentionStart.setDate(retentionStart.getDate() - 90)
  await db
    .delete(verificationAccessLog)
    .where(lt(verificationAccessLog.occurredAt, retentionStart))

  if (keyId) {
    await db
      .update(verificationKey)
      .set({ lastUsedAt: new Date() })
      .where(eq(verificationKey.id, keyId))
  }
}

export const readVerificationAudit = async () => {
  const since = new Date()
  since.setDate(since.getDate() - 90)

  return await db
    .select({
      occurredAt: verificationAccessLog.occurredAt,
      outcome: verificationAccessLog.outcome,
      reason: verificationAccessLog.reason,
      keyId: verificationAccessLog.keyId
    })
    .from(verificationAccessLog)
    .where(gte(verificationAccessLog.occurredAt, since))
    .orderBy(desc(verificationAccessLog.occurredAt))
    .limit(100)
}
