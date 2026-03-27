import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'mysql',
  out: './src/db/__migrations__',
  schema: './src/db/schema/*.sql.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? ''
  }
})
