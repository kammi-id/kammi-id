'use client'

import { useStore } from '@nanostores/react'
import { isLogoutDialogOpen, closeLogoutDialog } from './store'
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
import { useActionState, useEffect } from 'react'
import logoutFormAction, { type LogoutFormState } from './action'
import { toast } from 'sonner'

export function LogoutDialog() {
  const isOpen = useStore(isLogoutDialogOpen)
  const [state, formAction, isPending] = useActionState<
    LogoutFormState,
    FormData
  >(logoutFormAction, {})

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => !open && closeLogoutDialog()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Kamu yakin mau keluar?</AlertDialogTitle>
          <AlertDialogDescription>
            Sesi kamu akan berakhir dan kamu perlu login kembali untuk mengakses
            dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <form
            action={formAction}
            onSubmit={() => {
              closeLogoutDialog()
            }}
          >
            <AlertDialogAction
              type='submit'
              disabled={isPending}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isPending ? 'Mengeluarkan...' : 'Keluar'}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
