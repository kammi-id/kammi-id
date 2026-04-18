import { AccountForm } from './_components/account-form'
import { PasswordForm } from './_components/password-form'
import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { getCachedUser } from '../../_data/user'
import { UserCircle02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const AccountPage = async () => {
  const session = await readActiveSession()
  if (!session) {
    redirect('/login')
  }

  const [user] = await getCachedUser([session.userId])

  if (!user) {
    return (
      <div className='flex h-[calc(100vh-theme(spacing.24))] items-center justify-center'>
        <p className='text-muted-foreground'>Pengguna tidak ditemukan.</p>
      </div>
    )
  }

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        <div className='bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl'>
          <HugeiconsIcon
            icon={UserCircle02Icon}
            strokeWidth={2}
            className='size-7'
          />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>
            Pengaturan Akun
          </h1>
          <p className='text-muted-foreground'>
            Kelola informasi dan preferensi akun Anda.
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
        <div className='bg-card rounded-[2.5rem] border p-8 md:p-10'>
          <div className='space-y-8'>
            <div className='space-y-1'>
              <h2 className='text-xl font-semibold tracking-tight'>
                Informasi Profil
              </h2>
              <p className='text-muted-foreground text-sm'>
                Informasi ini akan ditampilkan secara publik.
              </p>
            </div>

            <div className='space-y-6'>
              <AccountForm
                initialData={{
                  name: user.name,
                  displayName: user.displayName
                }}
              />
            </div>
          </div>
        </div>

        <div className='bg-card rounded-[2.5rem] border p-8 md:p-10'>
          <div className='space-y-8'>
            <div className='space-y-1'>
              <h2 className='text-xl font-semibold tracking-tight'>Keamanan</h2>
              <p className='text-muted-foreground text-sm'>
                Perbarui kata sandi Anda untuk menjaga keamanan akun.
              </p>
            </div>

            <div className='space-y-6'>
              <PasswordForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountPage
