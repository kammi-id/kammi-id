import { cacheLife, cacheTag } from 'next/cache'
import { articleQuery, type ArticleListFilters } from '~/db/query/article'
import { articleCategoryQuery } from '~/db/query/article-category'

export const getCachedArticlesForOrg = async (
  organizationId: string,
  filters: ArticleListFilters
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag(`article-${organizationId}`)

  return articleQuery.listForOrg(organizationId, filters)
}

export const getCachedArticleById = async (id: string) => {
  'use cache'
  cacheLife('minutes')
  cacheTag(`article-detail-${id}`)

  return articleQuery.getById(id)
}

export const getCachedArticleTags = async (organizationId: string) => {
  'use cache'
  cacheLife('minutes')
  cacheTag(`article-${organizationId}`)

  return articleQuery.listDistinctTags(organizationId)
}

export const getCachedArticleCategories = async (organizationId: string) => {
  'use cache'
  cacheLife('minutes')
  cacheTag(`article-category-${organizationId}`)

  return articleCategoryQuery.listForOrg(organizationId)
}
