import { drizzle } from 'drizzle-orm/bun-sql'
import { SQL } from 'bun'

declare global {
  var client: SQL | undefined
}

const client =
  globalThis.client ??
  new SQL({
    url: process.env.DATABASE_URL,
    max: 10,
    idleTimeout: 300
  })

if (process.env.NODE_ENV === 'development') {
  globalThis.client = client
}

export const db = drizzle({ client })
