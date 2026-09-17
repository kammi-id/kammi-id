export type ArticleType = 'page' | 'blog'
export type ArticleStatus = 'draft' | 'published' | 'archived'

export const ARTICLE_TYPE_LABELS: Record<ArticleType, string> = {
  page: 'Halaman Statik',
  blog: 'Artikel Blog'
}

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: 'Draf',
  published: 'Terbit',
  archived: 'Diarsipkan'
}
