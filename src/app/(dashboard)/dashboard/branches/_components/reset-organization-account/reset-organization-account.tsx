'use client'

import { Key01Icon, Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/shadcn/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/shadcn/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { Input } from '~/components/shadcn/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { resetOrganizationAccountAction } from './action'
import type { ResettableOrganizationAccount } from './data'

type ResetOrganizationAccountProps = {
  accounts: ResettableOrganizationAccount[]
  organizationId: string
  organizationName: string
}

type Credential = {
  username: string
  password: string
  organizationIsNonActive: boolean
}

const copy = async (value: string) => {
  await navigator.clipboard.writeText(value)
  toast.success('Berhasil disalin.')
}

export const ResetOrganizationAccount = ({
  accounts,
  organizationId,
  organizationName
}: ResetOrganizationAccountProps) => {
  const [open, setOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [actorPassword, setActorPassword] = useState('')
  const [credential, setCredential] = useState<Credential | null>(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isPending, startTransition] = useTransition()
  const selectedAccount = accounts.find(
    (account) => account.id === selectedAccountId
  )

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSelectedAccountId('')
      setActorPassword('')
    }
  }

  const submit = () => {
    if (!selectedAccount) return

    startTransition(async () => {
      const result = await resetOrganizationAccountAction({
        targetAccountId: selectedAccount.id,
        targetOrganizationId: organizationId,
        actorPassword
      })
      if (!result.success || !result.credential) {
        toast.error(result.message)
        return
      }

      handleOpenChange(false)
      setCredential(result.credential)
      setIsPasswordVisible(false)
      toast.success(result.message)
    })
  }

  const requestConfirmation = () => {
    if (selectedAccount && actorPassword) setIsConfirmOpen(true)
  }

  return (
    <>
      <Button variant='outline' onClick={() => setOpen(true)}>
        <HugeiconsIcon
          icon={Key01Icon}
          strokeWidth={2}
          data-icon='inline-start'
        />
        Reset Password
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Reset Password Akun Kepengurusan</DialogTitle>
            <DialogDescription>
              Pilih Akun Kepengurusan aktual pada {organizationName}, lalu
              verifikasi kembali password Antum.
            </DialogDescription>
          </DialogHeader>

          {accounts.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              Struktur ini tidak memiliki Akun Kepengurusan aktual yang dapat
              direset.
            </p>
          ) : (
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='reset-organization-account'>
                  Akun Kepengurusan
                </FieldLabel>
                <Select
                  value={selectedAccountId}
                  onValueChange={(value) => setSelectedAccountId(value ?? '')}
                >
                  <SelectTrigger
                    id='reset-organization-account'
                    className='w-full'
                  >
                    <SelectValue placeholder='Pilih akun yang akan direset' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Akun aktual</SelectLabel>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.authority} — {account.username}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor='actor-password'>
                  Password saat ini
                </FieldLabel>
                <Input
                  id='actor-password'
                  type='password'
                  autoComplete='current-password'
                  value={actorPassword}
                  onChange={(event) => setActorPassword(event.target.value)}
                />
                <FieldDescription>
                  Reset akan mencabut seluruh sesi{' '}
                  {selectedAccount?.username ?? 'akun sasaran'}.
                </FieldDescription>
              </Field>
            </FieldGroup>
          )}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
            >
              Batal
            </Button>
            {accounts.length > 0 && (
              <Button
                type='button'
                onClick={requestConfirmation}
                disabled={!selectedAccount || !actorPassword || isPending}
              >
                {isPending && (
                  <HugeiconsIcon
                    icon={Loading03Icon}
                    strokeWidth={2}
                    className='animate-spin'
                    data-icon='inline-start'
                  />
                )}
                Reset {selectedAccount?.username ?? 'Password'} dan Cabut Sesi
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password akun ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Password untuk {selectedAccount?.username} pada {organizationName}{' '}
              akan diganti dan seluruh sesinya dicabut.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={submit} disabled={isPending}>
              Ya, reset dan cabut sesi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={credential !== null}
        onOpenChange={() => setCredential(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kredensial Baru</DialogTitle>
            <DialogDescription>
              Simpan sekarang. Password plaintext hanya tersedia pada dialog
              ini.
            </DialogDescription>
          </DialogHeader>
          {credential && (
            <div className='flex flex-col gap-4'>
              <div className='bg-muted/50 flex flex-col gap-2 rounded-3xl p-4'>
                <p className='text-muted-foreground text-sm'>Username</p>
                <code className='break-all'>{credential.username}</code>
              </div>
              <div className='bg-muted/50 flex flex-col gap-2 rounded-3xl p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <p className='text-muted-foreground text-sm'>Password baru</p>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                  >
                    {isPasswordVisible ? 'Sembunyikan' : 'Tampilkan'}
                  </Button>
                </div>
                <code className='break-all'>
                  {isPasswordVisible ? credential.password : '••••••••••••'}
                </code>
              </div>
              {credential.organizationIsNonActive && (
                <p className='text-muted-foreground text-sm'>
                  Struktur ini Non-Aktif; Akun Kepengurusan tetap tidak dapat
                  login sampai Struktur diaktifkan kembali.
                </p>
              )}
            </div>
          )}
          {credential && (
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => copy(credential.username)}
              >
                Salin username
              </Button>
              <Button
                type='button'
                variant='outline'
                onClick={() => copy(credential.password)}
              >
                Salin password
              </Button>
              <Button
                type='button'
                onClick={() =>
                  copy(`${credential.username}\n${credential.password}`)
                }
              >
                Salin keduanya
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
