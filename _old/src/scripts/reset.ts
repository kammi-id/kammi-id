// THIS FUNCTION IS DANGEROUS!
// BE SURE YOU KNOW WHAT ARE YOU DOING
// AND NEVER RUN IT IN PRODUCTION!

import { db } from '~/db/db'
import { sql } from 'drizzle-orm'

const hardReset = async (): Promise<void> => {
  await db.execute(sql`
    -- This wipes the app tables
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;

    -- This wipes the Drizzle metadata
    DROP SCHEMA IF EXISTS drizzle CASCADE;
  `)
}

hardReset()
