import { defineConfig } from 'drizzle-kit'

const DATABASE_URL = process.env.DATABASE_URL as string

export default defineConfig({
  dialect: 'postgresql',
  schema: 'src/db/schema/*.sql.ts',
  out: 'src/db/__migrations',
  dbCredentials: {
    url: DATABASE_URL
  }
})
