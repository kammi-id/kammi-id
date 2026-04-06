import './globals.css'

import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Public_Sans, Lora } from 'next/font/google'
import { cn } from '~/lib/utils'

const loraHeading = Lora({ subsets: ['latin'], variable: '--font-heading' })
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-sans' })

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
        loraHeading.variable
      )}
    >
      <body className='flex min-h-full flex-col'>{children}</body>
    </html>
  )
}

export default RootLayout

export const metadata: Metadata = {
  title: 'KAMMI.id',
  description: 'Coming Soon'
}
