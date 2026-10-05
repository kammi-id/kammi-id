import { cacheLife, cacheTag } from 'next/cache'
import {
  trainingQuery,
  type TrainingFilters,
  type UpcomingTraining
} from '~/db/query/training'

export type { UpcomingTraining }

export const getCachedUpcomingTrainings = async (
  organizationIds?: string[]
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('dauroh')

  return trainingQuery.getUpcoming(organizationIds, 10)
}

export const getCachedTrainingList = async (filters: TrainingFilters = {}) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('dauroh')

  return trainingQuery.getAll(filters)
}

export const getCachedTrainingByIdentifier = async (
  orgId: string,
  fullIdentifier: string
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('dauroh')

  return trainingQuery.getByIdentifier(orgId, fullIdentifier)
}
