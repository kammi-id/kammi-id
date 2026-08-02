import { redirect } from 'next/navigation'
import { AccessGuard } from '~/components/access-guard'
import { readActiveSession } from '~/lib/auth/cookies'
import {
  getCachedArticleCategories,
  getCachedArticleTags
} from '../../_data/articles'
import { ArticleForm } from '../_components/article-form'

const NewArticlePage = async () => {
  const session = await readActiveSession()
  const user = session?.user
  if (!user) redirect('/login')

  const organizationId = user.connectedOrganization?.id
  if (!organizationId) redirect('/dashboard')

  const categoryRows = await getCachedArticleCategories(organizationId)
  const categories = categoryRows.map((category) => ({
    id: category.id,
    name: category.name
  }))

  const tagSuggestions = await getCachedArticleTags(organizationId)

  return (
    <AccessGuard allowedRoles={['root', 'humas']}>
      <div className='flex flex-col gap-6 px-4 py-6 md:px-6 md:py-8 lg:px-8'>
        <div>
          <h1 className='text-2xl font-semibold'>Tambah Artikel</h1>
          <p className='text-muted-foreground text-sm'>
            Buat halaman statik atau artikel blog baru.
          </p>
        </div>

        <ArticleForm
          organizationId={organizationId}
          categories={categories}
          tagSuggestions={tagSuggestions}
        />
      </div>
    </AccessGuard>
  )
}

export default NewArticlePage
