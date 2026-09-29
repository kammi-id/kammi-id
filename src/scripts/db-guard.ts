import { requireDatabaseConsent } from '~/lib/db-guard/consent'

/**
 * drizzle-kit never goes through `src/db/db.ts`, so `db:migrate` and `db:push`
 * have no way to inherit the connection-layer guard. They run this gate first
 * instead: `bun src/scripts/db-guard.ts && drizzle-kit migrate`.
 *
 * The rule itself is not restated here — it lives in `src/lib/db-guard/`.
 */
try {
  requireDatabaseConsent()
} catch (error) {
  console.error(`❌ ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
