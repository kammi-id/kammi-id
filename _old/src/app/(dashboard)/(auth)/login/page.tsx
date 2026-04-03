import type { JSX } from 'react'
import LoginCard from './_components/form/card'
import LoginForm from './_components/form/form'
import { getActiveSession } from '~/lib/auth/cookies'
import { redirect } from 'next/navigation'

const LoginPage = async (): Promise<JSX.Element> => {
  const session = await getActiveSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <LoginCard>
      <LoginForm />
    </LoginCard>
  )
}

export default LoginPage
