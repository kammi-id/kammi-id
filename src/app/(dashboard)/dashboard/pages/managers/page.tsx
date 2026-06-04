import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pengaturan Halaman Pengurus | KAMMI.id',
  description: 'Kelola profil kepemimpinan dan pengurus pusat KAMMI.'
}

import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserGroupIcon } from '@hugeicons/core-free-icons'
import { LeadershipForm } from './_components/leadership-form'
import { getLeadershipSettings } from './_data/settings'

const ManagersSettingsPage = async () => {
  const session = await readActiveSession()
  if (!session) redirect('/login')

  const { role, connectedOrganization } = session.user
  const isRoot = role === 'root'
  const isHumas = role === 'humas'

  if (!isRoot && !isHumas) redirect('/dashboard')

  const orgId = connectedOrganization?.id
  if (!orgId) redirect('/dashboard')

  const leadership = await getLeadershipSettings(orgId)

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        <div className='bg-primary/10 text-primary ring-primary/5 flex size-12 shrink-0 items-center justify-center rounded-full ring-4'>
          <HugeiconsIcon
            icon={UserGroupIcon}
            strokeWidth={2}
            className='size-6'
          />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>
            Pengurus Pusat
          </h1>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            Kelola data pengurus yang ditampilkan di{' '}
            <span className='text-foreground font-medium'>kammi.id</span>.
          </p>
        </div>
      </div>

      <LeadershipForm initialData={leadership} />
    </div>
  )
}

export default ManagersSettingsPage
