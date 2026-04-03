'use client'

import { type JSX, useActionState, useRef, useEffect } from 'react'
import { Button } from '~/components/shadcn/ui/button'
import { Spinner } from '~/components/shadcn/ui/spinner'
import Form from 'next/form'
import logoutAction from './action'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { setOpenLogoutDialog } from './store'
import { LogOut } from 'lucide-react'

const LogoutForm = (): JSX.Element => {
  const [state, action, isPending] = useActionState(logoutAction, undefined)
  const prevPendingRef = useRef(isPending)
  const router = useRouter()

  useEffect(() => {
    if (prevPendingRef.current && !isPending) {
      if (!state?.errors) {
        toast.success(
          'Logout berhasil. Terima kasih telah menggunakan KAMMI.id.'
        )
        router.push('/')
      } else {
        toast.error('Logout gagal. Terjadi kesalahan saat logout.')
      }
    }

    prevPendingRef.current = isPending
  }, [state, isPending])

  useEffect(() => {
    return () => {
      setOpenLogoutDialog(false)
    }
  }, [])

  return (
    <Form action={action}>
      <Button type='submit' variant='destructive' disabled={isPending}>
        {isPending ? (
          <Spinner data-icon='inline-start' />
        ) : (
          <LogOut data-icon='inline-start' />
        )}
        <span>Logout</span>
      </Button>
    </Form>
  )
}

export default LogoutForm
