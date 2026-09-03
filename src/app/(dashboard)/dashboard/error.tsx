'use client'

import { ErrorView } from '~/components/error-view'

const Error = ({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) => {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <ErrorView type='general' context='dashboard' className='flex-1' />
    </div>
  )
}

export default Error
