import { db } from '../db/db'
import { sql } from 'drizzle-orm'

async function main() {
  console.log('🚮 Resetting database...')

  // Get all tables in public schema
  const query = sql`
    SELECT tablename FROM pg_catalog.pg_tables 
    WHERE schemaname = 'public'
  `
  const tables = (await db.execute(query)) as unknown as { tablename: string }[]

  if (tables.length === 0) {
    console.log('✨ Database is already empty!')
    return
  }

  // Drop all tables with CASCADE to handle foreign keys and metadata
  // We also drop drizzle's migration table
  const tableNames = tables.map((t) => `"${t.tablename}"`).join(', ')

  console.log(`🗑️  Dropping tables: ${tableNames}`)

  await db.execute(sql.raw(`DROP TABLE IF EXISTS ${tableNames} CASCADE`))

  // Also clean up any potential types or leftover drizzle metadata
  await db.execute(sql`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE`)

  console.log('✅ Database reset complete!')
}

main().catch((err) => {
  console.error('❌ Reset failed!')
  console.error(err)
  process.exit(1)
})
