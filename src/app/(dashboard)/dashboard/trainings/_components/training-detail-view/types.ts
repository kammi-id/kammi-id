import { trainingQuery } from '~/db/query/training'

export type TrainingWithDetails = NonNullable<
  Awaited<ReturnType<typeof trainingQuery.getByIdentifier>>
>
