import { cacheLife, cacheTag } from 'next/cache'
import { articleQuery, type ArticleListFilters } from '~/db/query/article'
import { articleCategoryQuery } from '~/db/query/article-category'

export const getCachedArticlesForOrg = async (
  organizationId: string,
  filters: ArticleListFilters
) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('articles')

  return articleQuery.listForOrg(organizationId, filters)
}

export const getCachedArticleById = async (id: string) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('articles')

  return articleQuery.getById(id)
}

export const getCachedArticleTags = async (organizationId: string) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('articles')

  return articleQuery.listDistinctTags(organizationId)
}

export const getCachedArticleCategories = async (organizationId: string) => {
  'use cache'
  cacheLife('minutes')
  cacheTag('articles')

  return articleCategoryQuery.listForOrg(organizationId)
}
