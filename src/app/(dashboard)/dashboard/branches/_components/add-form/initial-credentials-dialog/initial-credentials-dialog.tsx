'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/shadcn/ui/dialog'
import {
  credentialsToText,
  downloadCredentialsCsv,
  type InitialCredential
} from './credential-utils'

type InitialCredentialsDialogProps = {
  credentials: InitialCredential[]
  organizationSlug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const copy = async (value: string) => {
  await navigator.clipboard.writeText(value)
  toast.success('Berhasil disalin.')
}

export const InitialCredentialsDialog = ({
  credentials,
  organizationSlug,
  open,
  onOpenChange
}: InitialCredentialsDialogProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)

  React.useEffect(() => {
    if (!open) setIsPasswordVisible(false)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Kredensial awal Akun Kepengurusan</DialogTitle>
          <DialogDescription>
            Simpan dan distribusikan sekarang. Password plaintext hanya tersedia
            pada dialog ini dan tidak dapat dibaca kembali setelah ditutup.
          </DialogDescription>
        </DialogHeader>

        <div className='flex items-center justify-between gap-3'>
          <p className='text-muted-foreground text-sm'>
            {credentials.length} akun berhasil dibuat.
          </p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setIsPasswordVisible((visible) => !visible)}
          >
            {isPasswordVisible ? 'Sembunyikan password' : 'Tampilkan password'}
          </Button>
        </div>

        <div className='space-y-3'>
          {credentials.map((credential) => (
            <section
              key={`${credential.authority}-${credential.username}`}
              className='bg-muted/50 space-y-3 rounded-3xl p-4'
            >
              <p className='font-heading font-medium'>{credential.authority}</p>
              <div className='grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center'>
                <code className='min-w-0 text-sm break-all'>
                  {credential.username}
                </code>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => copy(credential.username)}
                >
                  Salin username
                </Button>
              </div>
              <div className='grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center'>
                <code className='min-w-0 text-sm break-all'>
                  {isPasswordVisible ? credential.password : '••••••••••••'}
                </code>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={() => copy(credential.password)}
                >
                  Salin password
                </Button>
              </div>
            </section>
          ))}
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => copy(credentialsToText(credentials))}
          >
            Salin Semua
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() =>
              downloadCredentialsCsv(credentials, organizationSlug)
            }
          >
            Download CSV
          </Button>
          <Button type='button' onClick={() => onOpenChange(false)}>
            Saya sudah menyimpan kredensial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
