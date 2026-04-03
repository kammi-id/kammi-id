import type { JSX, ReactNode } from 'react'
import Image from 'next/image'
import logo from '~/assets/logo.png'

const AuthLayout = ({ children }: { children: ReactNode }): JSX.Element => {
  return (
    <div className='bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
      <div className='flex w-full max-w-sm flex-col gap-6'>
        <div className='flex items-center gap-2 self-center font-medium'>
          <div className='bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md'>
            <Image
              className='size-[48px] object-contain'
              src={logo}
              alt='KAMMI.id'
              width={48}
              height={48}
            />
          </div>
          <span className='text-xl font-semibold'>KAMMI.id</span>
        </div>
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
