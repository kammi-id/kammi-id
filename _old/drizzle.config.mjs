// @ts-check
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL
  },
  schema: './src/db/schemas/**/*.sql.ts',
  out: './src/db/__migrations'
})
