import Link from 'next/link'
import { redirect } from 'next/navigation'
import { buttonVariants } from '~/components/shadcn/ui/button'
import { readActiveSession } from '~/lib/auth/cookies'
import { articleCategoryQuery } from '~/db/query/article-category'
import type { ArticleStatus } from '~/db/query/article'
import { getCachedArticlesForOrg } from '../_data/articles'
import { ArticleListView } from './_components/article-list-view'

interface ArticlesPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    categoryId?: string
  }>
}

export default async function ArticlesPage({
  searchParams
}: ArticlesPageProps) {
  const session = await readActiveSession()
  const user = session?.user
  if (!user) redirect('/login')

  const role = user.role ?? ''
  if (role !== 'root' && role !== 'humas') redirect('/dashboard')

  const organizationId = user.connectedOrganization?.id
  if (!organizationId) redirect('/dashboard')

  const params = await searchParams
  const search = params.search || undefined
  const status = params.status ? (params.status as ArticleStatus) : undefined
  const categoryId = params.categoryId || undefined

  const [rows, categoryRows] = await Promise.all([
    getCachedArticlesForOrg(organizationId, { search, status, categoryId }),
    articleCategoryQuery.listForOrg(organizationId)
  ])

  const articles = rows.map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type,
    status: row.status,
    slug: row.slug,
    categoryId: row.categoryId,
    updatedAt: row.updatedAt
  }))

  const categories = categoryRows.map((category) => ({
    id: category.id,
    name: category.name
  }))

  return (
    <div className='flex flex-col gap-6 px-4 py-6 md:px-6 md:py-8 lg:px-8'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold'>Daftar Artikel</h1>
          <p className='text-muted-foreground text-sm'>
            Kelola halaman statik dan artikel blog organisasi di sini.
          </p>
        </div>
        <Link href='/dashboard/articles/new' className={buttonVariants()}>
          Tambah Artikel
        </Link>
      </div>

      <ArticleListView articles={articles} categories={categories} />
    </div>
  )
}
