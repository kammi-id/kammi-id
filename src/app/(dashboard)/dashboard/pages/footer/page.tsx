import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { listSitePages } from '~/db/query/site-pages'
import { HugeiconsIcon } from '@hugeicons/react'
import { LayoutBottomIcon } from '@hugeicons/core-free-icons'
import { FooterForm } from './_components/footer-form'
import { getCachedFooterSettings } from './_data/settings'

const FooterSettingsPageContent = async () => {
  const session = await readActiveSession()
  if (!session) redirect('/login')

  const { role, connectedOrganization } = session.user
  if (role !== 'root' && role !== 'humas') redirect('/dashboard')

  const orgId = connectedOrganization?.id
  if (!orgId) redirect('/dashboard')

  const [footer, pages] = await Promise.all([
    getCachedFooterSettings(orgId),
    listSitePages(orgId)
  ])

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        <div className='bg-primary/10 text-primary ring-primary/5 flex size-12 shrink-0 items-center justify-center rounded-full ring-4'>
          <HugeiconsIcon
            icon={LayoutBottomIcon}
            strokeWidth={2}
            className='size-6'
          />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>
            Pengaturan Footer
          </h1>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            Kontak, menu tautan, dan media sosial di footer situs.
          </p>
        </div>
      </div>

      <div className='border-border rounded-3xl border bg-white px-6 py-6 shadow-xs'>
        <FooterForm initialData={footer} pages={pages} />
      </div>
    </div>
  )
}

const FooterSettingsPage = () => (
  <Suspense
    fallback={
      <p className='text-muted-foreground px-6 py-10'>Memuat pengaturan…</p>
    }
  >
    <FooterSettingsPageContent />
  </Suspense>
)

export default FooterSettingsPage
