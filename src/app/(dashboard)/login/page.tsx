import type { Metadata } from 'next'
import { LoginForm } from './_components/login-form'
import { readActiveSession } from '~/lib/auth/cookies'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Masuk',
  description: 'Masuk ke dashboard pengelola KAMMI.id.',
}

const LoginPage = async (props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const searchParams = await props.searchParams
  const session = await readActiveSession()

  if (session) {
    return redirect('/dashboard')
  }

  return (
    <div className='bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <LoginForm message={searchParams.message as string} />
      </div>
    </div>
  )
}

export default LoginPage
