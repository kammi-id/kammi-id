import { db } from '../db'
import { sql } from 'drizzle-orm'

async function setup() {
  try {
    await db.execute(
      sql`INSERT INTO organization (id, name, slug, code, type) VALUES ('019dcdb8-37f6-79b7-9016-8abeed8c1528', 'Test Org', 'test-org', 'TEST', 'pp') ON CONFLICT (id) DO NOTHING`
    )
    console.log('✅ Test organization ensured!')
  } catch (e) {
    console.error('❌ Error:', e)
    process.exit(1)
  }
}
setup()
