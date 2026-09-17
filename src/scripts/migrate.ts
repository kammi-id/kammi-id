import { drizzle } from 'drizzle-orm/bun-sql'
import { migrate } from 'drizzle-orm/bun-sql/migrator'
import { SQL } from 'bun'
import { classifyDatabaseUrl } from '~/lib/db-guard/database-url'
import { requireDatabaseConsent } from '~/lib/db-guard/consent'

const LOCK_TIMEOUT = '10s'

type MigrationOptions = {
  databaseUrl: string
  migrationsFolder: string
}

export const runMigrations = async ({
  databaseUrl,
  migrationsFolder
}: MigrationOptions): Promise<void> => {
  const pool = new SQL(databaseUrl)
  const connection = await pool.reserve()

  try {
    // The reserved connection is also handed to Drizzle, so this setting applies
    // to the transaction that executes every pending migration.
    await connection.unsafe(`SET lock_timeout = '${LOCK_TIMEOUT}'`)
    await migrate(drizzle({ client: connection }), { migrationsFolder })
  } finally {
    connection.release()
    await pool.end()
  }
}

const runGuardedMigrations = async (): Promise<void> => {
  requireDatabaseConsent()

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to run migrations.')
  }

  const target = classifyDatabaseUrl(databaseUrl)
  console.log(
    `Running guarded migrations for ${target?.host ?? 'an unreadable host'}/` +
      `${target?.database || 'an unnamed database'} with a ${LOCK_TIMEOUT} lock timeout.`
  )

  await runMigrations({
    databaseUrl,
    migrationsFolder: 'src/db/__migrations'
  })
}

if (import.meta.main) {
  await runGuardedMigrations()
}
