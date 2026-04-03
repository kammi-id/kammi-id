import './globals.css'

import type { ReactNode } from 'react'
import { Public_Sans, Merriweather } from 'next/font/google'
import { cn } from '~/lib/shadcn/utils'

const merriweatherHeading = Merriweather({
  subsets: ['latin'],
  variable: '--font-heading'
})
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-sans' })

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <html
      lang='id'
      className={cn(
        'font-sans antialiased',
        publicSans.variable,
        merriweatherHeading.variable
      )}
    >
      <body>{children}</body>
    </html>
  )
}

export default RootLayout

export const metadata = {
  title: 'KAMMI.id',
  description: 'Welcome to KAMMI.id'
}
