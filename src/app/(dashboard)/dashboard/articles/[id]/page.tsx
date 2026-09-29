import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { AccessGuard } from '~/components/access-guard'
import { readActiveSession } from '~/lib/auth/cookies'
import { isArticleOrgInScope } from '~/db/query/article'
import {
  getCachedArticleById,
  getCachedArticleCategories,
  getCachedArticleTags
} from '../../_data/articles'
import { ArticleForm } from '../_components/article-form'
import type { ArticleBodyJSON } from '../_components/article-body-editor'

interface EditArticlePageProps {
  params: Promise<{ id: string }>
}

const EditArticlePageContent = async ({ params }: EditArticlePageProps) => {
  const session = await readActiveSession()
  const user = session?.user
  if (!user) redirect('/login')

  const role = user.role ?? ''

  const { id } = await params
  const existing = await getCachedArticleById(id)
  if (!existing) notFound()

  const allowed = isArticleOrgInScope(
    {
      role,
      connectedOrganizationId: user.connectedOrganization?.id ?? null
    },
    existing.organizationId
  )
  if (!allowed) redirect('/dashboard/articles')

  const categoryRows = await getCachedArticleCategories(existing.organizationId)
  const categories = categoryRows.map((category) => ({
    id: category.id,
    name: category.name,
    parentId: category.parentId
  }))

  const tagSuggestions = await getCachedArticleTags(existing.organizationId)

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
            eventStartsAt: existing.eventStartsAt?.toISOString(),
            eventEndsAt: existing.eventEndsAt?.toISOString(),
            eventTimezone: existing.eventTimezone,
            eventLocation: existing.eventLocation,
            eventUrl: existing.eventUrl,
            eventCancelled: existing.eventCancelled,
            type: existing.type,
            title: existing.title,
            slug: existing.slug,
            body: existing.body as ArticleBodyJSON,
            featuredImage: existing.featuredImage,
            galleryImages: existing.galleryImages,
            penulis: existing.penulis,
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

const EditArticlePage = (props: EditArticlePageProps) => (
  <Suspense
    fallback={
      <p className='text-muted-foreground px-6 py-10'>Memuat pengaturan…</p>
    }
  >
    <EditArticlePageContent {...props} />
  </Suspense>
)

export default EditArticlePage
