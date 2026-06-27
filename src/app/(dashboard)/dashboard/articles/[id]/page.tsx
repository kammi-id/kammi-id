import { notFound, redirect } from 'next/navigation'
import { AccessGuard } from '~/components/access-guard'
import { readActiveSession } from '~/lib/auth/cookies'
import { articleQuery, isArticleOrgInScope } from '~/db/query/article'
import { articleCategoryQuery } from '~/db/query/article-category'
import { ArticleForm } from '../_components/article-form'
import type { ArticleBodyJSON } from '../_components/article-body-editor'

interface EditArticlePageProps {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({
  params
}: EditArticlePageProps) {
  const session = await readActiveSession()
  const user = session?.user
  if (!user) redirect('/login')

  const role = user.role ?? ''

  const { id } = await params
  const existing = await articleQuery.getById(id)
  if (!existing) notFound()

  const allowed = isArticleOrgInScope(
    {
      role,
      connectedOrganizationId: user.connectedOrganization?.id ?? null
    },
    existing.organizationId
  )
  if (!allowed) redirect('/dashboard/articles')

  const categoryRows = await articleCategoryQuery.listForOrg(
    existing.organizationId
  )
  const categories = categoryRows.map((category) => ({
    id: category.id,
    name: category.name
  }))

  const tagSuggestions = await articleQuery.listDistinctTags(
    existing.organizationId
  )

  return (
    <AccessGuard allowedRoles={['root', 'humas']}>
      <div className='flex flex-col gap-6 px-4 py-6 md:px-6 md:py-8 lg:px-8'>
        <div>
          <h1 className='text-2xl font-semibold'>Ubah Artikel</h1>
          <p className='text-muted-foreground text-sm'>
            Perbarui detail artikel ini.
          </p>
        </div>

        <ArticleForm
          key={existing.id}
          organizationId={existing.organizationId}
          categories={categories}
          tagSuggestions={tagSuggestions}
          initial={{
            id: existing.id,
            type: existing.type,
            title: existing.title,
            slug: existing.slug,
            body: existing.body as ArticleBodyJSON,
            featuredImage: existing.featuredImage,
            status: existing.status,
            tags: existing.tags,
            categoryId: existing.categoryId,
            publishedAt: existing.publishedAt?.toISOString()
          }}
        />
      </div>
    </AccessGuard>
  )
}
