import type { Metadata } from 'next'
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
      <TentangScene settings={settings} />
    </>
  )
}

export default TentangPage
