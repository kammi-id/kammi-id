import { pgMaterializedView } from 'drizzle-orm/pg-core'
import { memberCTE } from './cte/member.cte'

export const memberView = pgMaterializedView('member_view')
  .withNoData()
  .as((qb) => qb.with(memberCTE).select().from(memberCTE))
