import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { HugeiconsIcon } from '@hugeicons/react'
import { Settings02Icon } from '@hugeicons/core-free-icons'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/shadcn/ui/card'
import { Separator } from '~/components/shadcn/ui/separator'
import { HeroForm } from './_components/hero-form'
import { AboutForm } from './_components/about-form'
import { ActionsForm } from './_components/actions-form'
import { NavForm } from './_components/nav-form'
import { FooterForm } from './_components/footer-form'
import { MetadataForm } from './_components/metadata-form'
import {
  getCachedHeroSettings,
  getCachedAboutSettings,
  getCachedActionsSettings,
  getCachedNavSettings,
  getCachedFooterSettings,
  getCachedMetadataSettings
} from './_data/settings'

const HomeSettingsPage = async () => {
  const session = await readActiveSession()
  if (!session) redirect('/login')

  const { role, connectedOrganization } = session.user
  const isRoot = role === 'root'
  const isHumasPP = role === 'humas' && connectedOrganization?.type === 'pp'

  if (!isRoot && !isHumasPP) redirect('/dashboard')

  const [hero, about, actions, nav, footer, metadata] = await Promise.all([
    getCachedHeroSettings(),
    getCachedAboutSettings(),
    getCachedActionsSettings(),
    getCachedNavSettings(),
    getCachedFooterSettings(),
    getCachedMetadataSettings()
  ])

  const sections = [
    {
      id: 'hero',
      title: 'Seksi Hero',
      description: 'Judul utama, foto, kutipan, dan tombol CTA halaman depan.',
      content: <HeroForm initialData={hero} />
    },
    {
      id: 'about',
      title: 'Tentang KAMMI',
      description: 'Paragraf deskripsi organisasi dan card Mini Strategi.',
      content: <AboutForm initialData={about} />
    },
    {
      id: 'actions',
      title: 'Aksi & Program',
      description: 'Daftar program aksi nyata KAMMI beserta foto dan deskripsinya.',
      content: <ActionsForm initialData={actions} />
    },
    {
      id: 'nav',
      title: 'Navigasi',
      description: 'Link menu navbar dan tombol CTA bergabung.',
      content: <NavForm initialData={nav} />
    },
    {
      id: 'footer',
      title: 'Footer',
      description: 'Link sosial media dan kelompok tautan di footer halaman.',
      content: <FooterForm initialData={footer} />
    },
    {
      id: 'metadata',
      title: 'Metadata & SEO',
      description: 'Judul halaman, deskripsi meta, dan gambar Open Graph untuk media sosial.',
      content: <MetadataForm initialData={metadata} />
    }
  ]

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        <div className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
          <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} className='size-6' />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>
            Pengaturan Halaman Utama
          </h1>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            Kelola konten yang ditampilkan di <span className='font-medium text-foreground'>kammi.id</span>. Perubahan langsung aktif setelah disimpan.
          </p>
        </div>
      </div>

      <div className='space-y-6'>
        {sections.map((section, i) => (
          <Card key={section.id} className='rounded-3xl shadow-xs'>
            <CardHeader className='border-b pb-5'>
              <div className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-mono text-xs text-muted-foreground'>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Separator orientation='vertical' className='h-3' />
                    <CardTitle className='text-base font-semibold'>{section.title}</CardTitle>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-6 pb-6'>
              {section.content}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default HomeSettingsPage
