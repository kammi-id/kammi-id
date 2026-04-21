import { Metadata } from 'next'
import { UnderConstructionClient } from './_components/under-construction-client'

export const metadata: Metadata = {
  title: 'Coming Soon | KAMMI.id',
  description:
    'Kami sedang membangun rumah digital baru untuk KAMMI.id. Sesuatu yang lebih enerjik, profesional, dan inklusif sedang dipersiapkan.',
  openGraph: {
    title: 'Coming Soon | KAMMI.id',
    description:
      'Sesuatu yang lebih enerjik, profesional, dan inklusif sedang dipersiapkan.',
    images: [
      {
        url: '/assets/logo.png',
        width: 1200,
        height: 630,
        alt: 'KAMMI.id Under Construction'
      }
    ]
  }
}

const Page = () => {
  return <UnderConstructionClient />
}

export default Page
