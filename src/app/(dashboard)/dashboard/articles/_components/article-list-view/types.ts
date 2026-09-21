export type ArticleListItem = {
  id: string
  title: string
  type: 'page' | 'blog' | 'event'
  status: 'draft' | 'published' | 'archived'
  slug: string
  categoryId: string | null
  updatedAt: Date
}

export type ArticleCategoryOption = { id: string; name: string }
