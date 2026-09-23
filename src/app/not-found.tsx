import { notFound } from 'next/navigation'
import { ErrorView } from '~/components/error-view'

const NotFound = () => {
  return <ErrorView type='404' context='public' />
}

export default NotFound
