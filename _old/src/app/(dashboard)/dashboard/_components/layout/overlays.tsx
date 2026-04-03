'use client'

import type { JSX } from 'react'
import dynamic from 'next/dynamic'
import { DialogClose } from '~/components/shadcn/ui/dialog'
import { Button } from '~/components/shadcn/ui/button'

const LogoutDialog = dynamic(() => import('../logout/dialog'))
const LogoutForm = dynamic(() => import('../logout/form'))

const DashboardOverlays = (): JSX.Element => {
  return (
    <LogoutDialog
      footer={
        <>
          <DialogClose render={<Button variant='ghost' />}>Batal</DialogClose>
          <LogoutForm />
        </>
      }
    />
  )
}

export default DashboardOverlays
