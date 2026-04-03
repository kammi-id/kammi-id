import { pgMaterializedView } from 'drizzle-orm/pg-core'
import { trainingCTE } from './cte/training.cte'

export const trainingView = pgMaterializedView('training_view')
  .withNoData()
  .as((qb) => qb.with(trainingCTE).select().from(trainingCTE))
