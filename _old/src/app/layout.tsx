import type { JSX, ReactNode } from 'react'
import dynamic from 'next/dynamic'
import './globals.css'

const ReactScan = dynamic(() => import('~/components/dev/react-scan'))

const RootLayout = ({ children }: { children: ReactNode }): JSX.Element => {
  return (
    <html lang='id'>
      <body className='min-h-dvh'>
        {children}
        {process.env.NODE_ENV === 'development' && <ReactScan />}
      </body>
    </html>
  )
}

export default RootLayout
