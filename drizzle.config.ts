import { defineConfig } from 'drizzle-kit'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const DATABASE_URL = process.env.DATABASE_URL as string

export default defineConfig({
  dialect: 'postgresql',
  schema: 'src/db/schema/*.sql.ts',
  out: 'src/db/__migrations',
  dbCredentials: {
    url: DATABASE_URL
  }
})
