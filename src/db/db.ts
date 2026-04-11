import { drizzle } from 'drizzle-orm/bun-sql'
import { SQL } from 'bun'

const DATABASE_URL = process.env.DATABASE_URL as string

const client = new SQL(DATABASE_URL)

export const db = drizzle({ client })
