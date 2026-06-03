import { db } from './src/db/db'
import { siteSettings } from './src/db/schema'
import { like } from 'drizzle-orm'
const rows = await db.select().from(siteSettings).where(like(siteSettings.key, 'tentang%'))
console.log(JSON.stringify(rows, null, 2))
process.exit(0)
