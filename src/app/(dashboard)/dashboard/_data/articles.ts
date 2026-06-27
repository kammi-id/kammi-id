import { cacheLife, cacheTag } from 'next/cache'
import { articleQuery, type ArticleListFilters } from '~/db/query/article'

export const getCachedArticlesForOrg = async (
  organizationId: string,
  filters: ArticleListFilters
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('articles')

  return articleQuery.listForOrg(organizationId, filters)
}
