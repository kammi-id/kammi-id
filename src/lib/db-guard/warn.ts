import { getLogger } from '@logtape/logtape'
import { classifyDatabaseUrl } from './database-url'

const logger = getLogger(['app', 'db'])

/**
 * The non-destructive counterpart to `requireDatabaseConsent`, for `next dev`
 * and `next start`. A remote database is the normal state there, so this warns
 * once at boot and never blocks — warning daily about the normal case only
 * teaches people to ignore warnings.
 *
 * Lives apart from `consent.ts` on purpose: this module reaches for the app
 * logger, which is only configured inside Next.js. The consent guard runs in
 * bare `bun` processes that never boot LogTape, so it must not pull it in.
 */
export const warnRemoteDatabase = (): void => {
  const target = classifyDatabaseUrl(process.env.DATABASE_URL)
  if (!target || target.isLocal) return

  logger.warn(
    'DATABASE_URL points at {host}/{database} — treat it as production.',
    { host: target.host, database: target.database }
  )
}
