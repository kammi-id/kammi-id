import { pgView } from 'drizzle-orm/pg-core'
import { userCTE } from './cte/user.cte'

export const userView = pgView('user_view').as((qb) =>
  qb.with(userCTE).select().from(userCTE)
)
