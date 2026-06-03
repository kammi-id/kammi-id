import './globals.css'

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Public_Sans, Lora, Caveat } from 'next/font/google'
import { cn } from '~/lib/shadcn/utils'

const loraHeading = Lora({ subsets: ['latin'], variable: '--font-heading' })
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-sans' })
const caveatHand = Caveat({ subsets: ['latin'], variable: '--font-handwriting' })

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
      <body className='flex min-h-full flex-col'>{children}</body>
    </html>
  )
}

export default RootLayout

export const metadata: Metadata = {
  title: 'KAMMI.id',
  description: 'Coming Soon'
}
