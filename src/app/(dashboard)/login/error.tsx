'use client'

import { ErrorView } from '~/components/error-view'

const ErrorPage = ({
  error: _error,
  reset: _reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) => {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <ErrorView type='general' context='public' className='flex-1' />
    </div>
  )
}

export default ErrorPage
