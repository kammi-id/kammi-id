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
          {/*
           * This page serves every Jenjang (pengurus applies to the lean
           * template too, ticket 04) — the heading names the Struktur
           * itself rather than hardcoding "Pengurus Pusat", which used to
           * show even on a PW/PD/PK's own settings page.
           */}
          <h1 className='font-heading text-3xl font-bold tracking-tight'>
            Pengurus {connectedOrganization.name}
          </h1>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            Kelola data pengurus yang ditampilkan di situs Anda.
          </p>
        </div>
      </div>

      <LeadershipForm initialData={leadership} />
    </div>
  )
}

export default ManagersSettingsPage
