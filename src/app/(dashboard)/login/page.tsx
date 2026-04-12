import { LoginForm } from '~/components/shadcn/login-form'
import { readActiveSession } from '~/lib/auth/cookies'
import { redirect } from 'next/navigation'

const LoginPage = async () => {
  const session = await readActiveSession()

  if (session) {
    return redirect('/dashboard')
  }

  return (
    <div className='bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
      <div className='w-full max-w-sm'>
        <LoginForm />
      </div>
    </div>
  )
}

export default LoginPage
