import type { Metadata } from 'next'
import Link from 'next/link'
import { TentangScene } from './_components/tentang-scene'
import { SectionNav } from './_components/section-nav'
import { getTentangSettings } from '~/app/(main)/_data/site-settings'
import { buildBreadcrumb } from '~/lib/seo'

export const metadata: Metadata = {
  title: 'Tentang',
  description:
    'Mengenal KAMMI — sejarah, visi, misi, karakteristik, prinsip, paradigma, dan kredo gerakan.',
  openGraph: {
    title: 'Tentang',
    description:
      'Mengenal KAMMI — sejarah, visi, misi, karakteristik, prinsip, paradigma, dan kredo gerakan.'
  }
}

const TentangPage = async () => {
  const settings = await getTentangSettings()

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: 'Beranda', url: '/' },
              { name: 'Tentang', url: '/tentang' }
            ])
          )
        }}
      />
      <SectionNav />

      {/* Breadcrumb */}
      <nav
        aria-label='Breadcrumb'
        className='relative z-10 -mb-11 bg-linear-to-b from-black/45 to-transparent px-6 py-3 lg:px-8'
      >
        <ol className='flex items-center gap-2 text-sm text-white/70'>
          <li>
            <Link href='/' className='transition-colors hover:text-white'>
              Beranda
            </Link>
          </li>
          <li aria-hidden='true' className='select-none text-white/40'>
            /
          </li>
          <li>
            <span aria-current='page' className='font-medium text-white'>
              Tentang KAMMI
            </span>
          </li>
        </ol>
      </nav>

      <TentangScene settings={settings} />
    </>
  )
}

export default TentangPage
