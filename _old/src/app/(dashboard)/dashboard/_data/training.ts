import { getTraining as getFromDB } from '~/db/query/training'
import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'

export const getTraining = cache(
  async (params: Parameters<typeof getFromDB>[0]) => {
    'use cache'
    cacheLife('days')

    const tags: string[] = ['training']

    if (params?.id?.length) {
      params.id.forEach((id) => tags.push(`training:id:${id}`))
    }

    if (params?.type?.length) {
      params.type.forEach((type) => tags.push(`training:type:${type}`))
    }

    if (params?.organizerId) {
      tags.push(`training:organizer:${params.organizerId}`)
    }

    if (params?.organizerScopeId) {
      tags.push(`training:scope:${params.organizerScopeId}`)
    }

    cacheTag(...tags)

    return await getFromDB(params)
  }
)

export default getTraining

export type Training = NonNullable<
  Awaited<ReturnType<typeof getTraining>>[1]
>[number]
