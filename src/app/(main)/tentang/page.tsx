import type { Metadata } from 'next'
import { TentangScene } from './_components/tentang-scene'
import { SejarahSection } from './_components/sejarah-section'
import { MisiSection } from './_components/misi-section'
import { KarakteristikSection } from './_components/karakteristik-section'
import { UnsurSection } from './_components/unsur-section'
import { PrinsipSection } from './_components/prinsip-section'
import { ParadigmaSection } from './_components/paradigma-section'
import { KredoSection } from './_components/kredo-section'
import { SectionNav } from './_components/section-nav'

export const metadata: Metadata = {
  title: 'Tentang KAMMI',
  description:
    'Mengenal KAMMI — sejarah, visi, misi, karakteristik, prinsip, paradigma, dan kredo gerakan.'
}

const TentangPage = () => {
  return (
    <>
      <SectionNav />
      <TentangScene />
      <MisiSection />
      <KarakteristikSection />
      <UnsurSection />
      <PrinsipSection />
      <ParadigmaSection />
      <KredoSection />
      <SejarahSection />
    </>
  )
}

export default TentangPage
