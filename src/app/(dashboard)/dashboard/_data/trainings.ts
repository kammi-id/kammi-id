import { cacheLife, cacheTag } from 'next/cache'
import { trainingQuery, type UpcomingTraining } from '~/db/query/training'

export type { UpcomingTraining }

export const getCachedUpcomingTrainings = async (
  organizationIds?: string[]
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('dauroh')

  return trainingQuery.getUpcoming(organizationIds, 10)
}
