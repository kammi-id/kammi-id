import type { JSX } from 'react'
import Empty from '~/components/common/empty'
import { Button } from '~/components/shadcn/ui/button'
import Link from 'next/link'

const page = {
  title: 'Under Construction',
  description: 'KAMMI.id sedang dalam development.'
} as const

const LandingPage = (): JSX.Element => {
  return (
    <Empty {...page} className='h-dvh'>
      <Button
        variant='link'
        nativeButton={false}
        render={<Link href='/dashboard' />}
      >
        Buka Dashboard
      </Button>
    </Empty>
  )
}

export default LandingPage
