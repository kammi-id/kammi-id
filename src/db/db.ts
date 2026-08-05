import { drizzle } from 'drizzle-orm/bun-sql'
import { SQL } from 'bun'
import { requireDatabaseConsent } from '~/lib/db-guard/consent'

// The guard belongs to the connection layer, not to any one caller: every
// destructive door — `bun test`, `db:reset`, `db:seed` — reaches the database
// through this module, so gating it here covers them all without duplication.
//
// Next.js replaces `process.env.NEXT_RUNTIME` at build time — 'nodejs' in the
// server bundle (dev, build-time prerender, start), 'edge' on the edge, '' on
// the client. It is only ever `undefined` outside Next's bundler, which is
// exactly where the destructive commands run. Serving traffic against a remote
// database is normal, so Next warns at boot instead (`src/instrumentation.ts`).
if (process.env.NEXT_RUNTIME === undefined) {
  requireDatabaseConsent()
}

const DATABASE_URL = process.env.DATABASE_URL as string

type DB = ReturnType<typeof drizzle>

declare global {
  var db: DB | undefined
}

let db: DB

if (process.env.NODE_ENV === 'development') {
  if (!global.db) {
    global.db = drizzle({ client: new SQL(DATABASE_URL) })
  }
  db = global.db as DB
} else {
  db = drizzle({ client: new SQL(DATABASE_URL) })
}

export { db }
