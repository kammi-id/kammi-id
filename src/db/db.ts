import { drizzle } from 'drizzle-orm/bun-sql'
import { SQL } from 'bun'

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
