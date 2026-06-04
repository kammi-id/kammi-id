import type { Metadata } from 'next'
import Link from 'next/link'
import { TentangScene } from './_components/tentang-scene'
import { SectionNav } from './_components/section-nav'
import { getTentangSettings } from '~/app/(main)/_data/site-settings'

export const metadata: Metadata = {
  title: 'Tentang KAMMI',
  description:
    'Mengenal KAMMI — sejarah, visi, misi, karakteristik, prinsip, paradigma, dan kredo gerakan.'
}

const TentangPage = async () => {
  const settings = await getTentangSettings()

  return (
    <>
      <SectionNav />

      {/* Breadcrumb */}
      <nav aria-label='Breadcrumb' className='px-6 py-3 lg:px-8'>
        <ol className='text-muted-foreground flex items-center gap-2 text-sm'>
          <li>
            <Link href='/' className='hover:text-foreground transition-colors'>
              Beranda
            </Link>
          </li>
          <li aria-hidden='true' className='select-none'>
            /
          </li>
          <li>
            <span aria-current='page' className='text-foreground font-medium'>
              Tentang KAMMI
            </span>
          </li>
        </ol>
      </nav>

      {/* Outer wrapper provides the scroll distance (1900vh = 1800vh animation + 100vh scene).
          TentangScene uses position:sticky so GSAP never needs pin:true, avoiding the
          React <Activity> insertBefore conflict caused by ScrollTrigger's pinSpacerDiv. */}
      <div style={{ height: '1900vh' }}>
        <TentangScene settings={settings} />
      </div>
    </>
  )
}

export default TentangPage
