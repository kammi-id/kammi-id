import { trainingQuery } from '@/db/query/training'

export type TrainingWithDetails = NonNullable<
  ReturnType<typeof trainingQuery.getByIdentifier>
>
