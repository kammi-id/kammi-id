import { QueryBuilder } from 'drizzle-orm/pg-core'
import { training as table } from '../../table/training.sql'
import { sql } from 'drizzle-orm'

export const qb = new QueryBuilder()

export const trainingSerialCTE = qb.$with('training_serial_cte').as(
  qb
    .select({
      id: table.id,
      serial: sql<string>`
        (extract(year from ${table.dateStart})::text ||
        lpad(row_number() over (
          partition by ${table.organizerId}, extract(year from ${table.dateStart})
          order by ${table.dateStart} asc, ${table.id} asc
        )::text, 3, '0'))
      `.as('serial')
    })
    .from(table)
)
