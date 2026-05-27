import type { Metadata } from 'next'
import { HeroSection } from './_components/hero-section'
import { AboutSection } from './_components/about-section'
import { ActionsSection } from './_components/actions-section'
import { LeadershipSection } from './_components/leadership-section'
import { NetworkSection } from './_components/network-section'
import { PublicationsSection } from './_components/publications-section'
import { CtaSection } from './_components/cta-section'
import { getMetadataSettings } from './_data/site-settings'

export const generateMetadata = async (): Promise<Metadata> => {
  const meta = await getMetadataSettings()
  return {
    title: meta.pageTitle,
    description: meta.metaDescription,
    openGraph: {
      title: meta.pageTitle,
      description: meta.metaDescription,
      images: [
        {
          url: meta.ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'KAMMI.id'
        }
      ]
    }
  }
}

const Page = () => {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <ActionsSection />
      <LeadershipSection showMoreLink />
      <NetworkSection />
      <PublicationsSection />
      <CtaSection />
    </>
  )
}

export default Page
