import { db } from '../db/db'
import { sql } from 'drizzle-orm'

const main = async () => {
  const tables = (await db.execute(sql`
    SELECT tablename FROM pg_catalog.pg_tables
    WHERE schemaname = 'public'
  `)) as unknown as { tablename: string }[]

  if (tables.length === 0) return

  const tableNames = tables.map((table) => `"${table.tablename}"`).join(', ')
  await db.execute(
    sql.raw(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`)
  )
}

main().catch((error) => {
  console.error('❌ Gagal membersihkan database untuk E2E!')
  console.error(error)
  process.exit(1)
})
