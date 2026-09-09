import { redirect } from 'next/navigation'
import { AccessGuard } from '~/components/access-guard'
import { readActiveSession } from '~/lib/auth/cookies'
import { getCachedArticleCategories } from '../../_data/articles'
import { ArticleCategoryManager } from '../_components/article-category-manager'

const ArticleCategoriesPage = async () => {
  const session = await readActiveSession()
  const user = session?.user
  if (!user) redirect('/login')

  const organizationId = user.connectedOrganization?.id
  if (!organizationId) redirect('/dashboard')

  const categories = await getCachedArticleCategories(organizationId)

  return (
    <AccessGuard allowedRoles={['root', 'humas']}>
      <div className='flex flex-col gap-6 px-4 py-6 md:px-6 md:py-8 lg:px-8'>
        <div>
          <h1 className='text-2xl font-semibold'>Kategori Artikel</h1>
          <p className='text-muted-foreground text-sm'>
            Kelola kategori bertingkat untuk artikel organisasi antum.
          </p>
        </div>

        <ArticleCategoryManager
          organizationId={organizationId}
          categories={categories}
        />
      </div>
    </AccessGuard>
  )
}

export default ArticleCategoriesPage
