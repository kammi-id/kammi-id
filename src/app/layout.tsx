import './globals.css'

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Public_Sans, Lora, Caveat } from 'next/font/google'
import { cn } from '~/lib/shadcn/utils'

const loraHeading = Lora({ subsets: ['latin'], variable: '--font-heading' })
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-sans' })
const caveatHand = Caveat({
  subsets: ['latin'],
  variable: '--font-handwriting'
})

// PP's host — the fallback for every route this layout serves that isn't
// under `[strukturSlug]` (the dashboard has no Struktur segment, ADR 0012)
// and for the brief window before `[strukturSlug]/layout.tsx`'s own
// `generateMetadata` resolves a Struktur-scoped one. A nested segment's
// `metadataBase` overrides this for itself and everything below it
// (metadata fields are merged shallowly, last segment wins — see Next.js
// docs on `generateMetadata`'s Merging/`metadataBase` sections).
export const metadata: Metadata = {
  metadataBase: new URL('https://www.kammi.id'),
  title: {
    default: 'KAMMI.id',
    template: '%s — KAMMI.id'
  },
  description: 'Platform digital Kesatuan Aksi Mahasiswa Muslim Indonesia.',
  openGraph: {
    siteName: 'KAMMI.id',
    locale: 'id_ID',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    site: '@KAMMIPusat'
  },
  robots: { index: true, follow: true }
}

const RootLayout = ({
  children
}: Readonly<{
  children: ReactNode
}>) => {
  return (
    <html
      lang='id'
      className={cn(
        'font-sans antialiased',
        publicSans.variable,
        loraHeading.variable,
        caveatHand.variable
      )}
    >
      <head>
        <meta name='apple-mobile-web-app-title' content='KAMMI.id' />
      </head>
      <body className='flex min-h-full flex-col overflow-x-hidden'>
        {children}
        <div id='portal-root' aria-hidden='true' />
      </body>
    </html>
  )
}

export default RootLayout
