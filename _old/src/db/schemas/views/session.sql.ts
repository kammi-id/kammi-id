import { pgView } from 'drizzle-orm/pg-core'
import { sessionCTE } from './cte/session.cte'

export const sessionView = pgView('session_view').as((qb) =>
  qb.with(sessionCTE).select().from(sessionCTE)
)
