import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { HugeiconsIcon } from '@hugeicons/react'
import { Settings02Icon } from '@hugeicons/core-free-icons'
import { Separator } from '~/components/shadcn/ui/separator'
import { isSitusSectionVisible } from '~/lib/struktur/situs-template'
import { HomeItemsList } from './_components/home-items-list'
import { AboutForm } from './_components/about-form'
import { NavForm } from './_components/nav-form'
import { FooterForm } from './_components/footer-form'
import { MetadataForm } from './_components/metadata-form'
import {
  saveHomeHeroItemsAction,
  saveHomeExtraItemsAction
} from './_components/action'
import {
  getCachedHomeHeroItemsSettings,
  getCachedHomeExtraItemsSettings,
  getCachedAboutSettings,
  getCachedNavSettings,
  getCachedFooterSettings,
  getCachedMetadataSettings
} from './_data/settings'

const HomeSettingsPage = async () => {
  const session = await readActiveSession()
  if (!session) redirect('/login')

  const { role, connectedOrganization } = session.user
  const isRoot = role === 'root'
  const isHumas = role === 'humas'

  if (!isRoot && !isHumas) redirect('/dashboard')

  const orgId = connectedOrganization?.id
  if (!orgId) redirect('/dashboard')

  const jenjang = connectedOrganization.type

  const [heroSettings, extraSettings, about, nav, footer, metadata] =
    await Promise.all([
      getCachedHomeHeroItemsSettings(orgId),
      getCachedHomeExtraItemsSettings(orgId),
      getCachedAboutSettings(orgId),
      getCachedNavSettings(orgId),
      getCachedFooterSettings(orgId),
      getCachedMetadataSettings(orgId)
    ])

  // Every section the settings page can possibly show, each tagged with the
  // `SitusSectionKey` that decides whether *this* Struktur's template
  // actually renders it. `isSitusSectionVisible` (`~/lib/struktur/situs-
  // template.ts`) is the single place that mapping lives — ticket 04's own
  // acceptance criterion — so this list only ever decides *order and
  // content*, never *whether*.
  const sections = [
    {
      id: 'hero',
      key: 'hero-items' as const,
      index: '01',
      title: 'Hero Sections',
      description:
        'Section pertama yang tampil di halaman utama sebagai background penuh.',
      content: (
        <HomeItemsList
          label='Hero Sections'
          description='Setiap item tampil sebagai section full-screen di bagian atas halaman utama.'
          initialItems={heroSettings.items}
          folder='site-settings/hero'
          action={saveHomeHeroItemsAction}
        />
      )
    },
    {
      id: 'about',
      key: 'about' as const,
      index: '02',
      title: 'Tentang',
      description: 'Ringkasan organisasi yang tampil di bawah Hero Sections.',
      content: <AboutForm initialData={about} />
    },
    {
      id: 'extra',
      key: 'extra-items' as const,
      index: '03',
      title: 'Extra Sections',
      description:
        'Section tambahan yang tampil setelah Peta Jaringan, berurutan dari atas.',
      content: (
        <HomeItemsList
          label='Extra Sections'
          description='Setiap item tampil sebagai section full-screen setelah bagian Peta Jaringan.'
          initialItems={extraSettings.items}
          folder='site-settings/extra'
          action={saveHomeExtraItemsAction}
        />
      )
    },
    {
      id: 'nav',
      key: 'nav' as const,
      index: '04',
      title: 'Navigasi',
      description: 'Menu dan tombol CTA pada navbar situs.',
      content: <NavForm initialData={nav} />
    },
    {
      id: 'footer',
      key: 'footer' as const,
      index: '05',
      title: 'Footer',
      description: 'Tautan sosial media dan kolom footer situs.',
      content: <FooterForm initialData={footer} />
    },
    {
      id: 'metadata',
      key: 'metadata' as const,
      index: '06',
      title: 'Metadata Halaman',
      description: 'Judul, deskripsi, dan gambar OG untuk mesin pencari.',
      content: <MetadataForm initialData={metadata} />
    }
  ].filter((section) => isSitusSectionVisible(jenjang, section.key))

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        <div className='bg-primary/10 text-primary ring-primary/5 flex size-12 shrink-0 items-center justify-center rounded-full ring-4'>
          <HugeiconsIcon
            icon={Settings02Icon}
            strokeWidth={2}
            className='size-6'
          />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>
            Pengaturan Halaman Utama
          </h1>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            Kelola konten yang ditampilkan di{' '}
            <span className='text-foreground font-medium'>kammi.id</span>.
            Perubahan langsung aktif setelah disimpan.
          </p>
        </div>
      </div>

      <div className='space-y-6'>
        {sections.map((section) => (
          <div
            key={section.id}
            className='border-border rounded-3xl border bg-white shadow-xs'
          >
            <div className='border-b px-6 py-5'>
              <div className='flex items-start gap-3'>
                <span className='text-muted-foreground mt-0.5 font-mono text-xs'>
                  {section.index}
                </span>
                <Separator orientation='vertical' className='mt-0.5 h-3.5' />
                <div>
                  <p className='text-foreground text-base font-semibold'>
                    {section.title}
                  </p>
                  <p className='text-muted-foreground mt-0.5 text-sm'>
                    {section.description}
                  </p>
                </div>
              </div>
            </div>
            <div className='px-6 py-6'>{section.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default HomeSettingsPage
