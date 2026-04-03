import { getOrganization as getFromDB } from '~/db/query/organization'
import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'

export const getOrganization = cache(
  async (params: Parameters<typeof getFromDB>[0]) => {
    'use cache'
    cacheLife('max')

    const tags: string[] = ['organization']

    if (params?.id?.length) {
      params.id.forEach((id) => tags.push(`organization:id:${id}`))
    }

    if (params?.type?.length) {
      params.type.forEach((type) => tags.push(`organization:type:${type}`))
    }

    if (params?.scopeId) {
      tags.push(`organization:scope:${params.scopeId}`)
    }

    cacheTag(...tags)

    return await getFromDB(params)
  }
)

export default getOrganization

export type Organization = NonNullable<
  Awaited<ReturnType<typeof getOrganization>>[1]
>[number]
