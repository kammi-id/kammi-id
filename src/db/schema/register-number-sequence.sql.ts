import { pgTable } from 'drizzle-orm/pg-core'

/**
 * High-water mark per NIA prefix (ADR 0020). `lastSeq` only ever increases —
 * allocation is one atomic `INSERT ... ON CONFLICT DO UPDATE ... RETURNING`
 * (see `generateRegisterNumber`, `src/lib/utils/member.ts`), never a
 * read-then-write `MAX()+1`. Deleting the Kader holding the highest number on
 * a prefix does not lower this row, so the number never gets reissued.
 */
export const registerNumberSequence = pgTable('register_number_sequence', (t) => ({
  prefix: t.text('prefix').primaryKey(),
  lastSeq: t.integer('last_seq').notNull()
}))
