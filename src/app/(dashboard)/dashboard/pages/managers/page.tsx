import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserGroupIcon } from '@hugeicons/core-free-icons'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/shadcn/ui/card'
import { Separator } from '~/components/shadcn/ui/separator'
import { LeadershipForm } from './_components/leadership-form'
import { getCachedLeadershipSettings } from './_data/settings'

const ManagersSettingsPage = async () => {
  const session = await readActiveSession()
  if (!session) redirect('/login')

  const { role, connectedOrganization } = session.user
  const isRoot = role === 'root'
  const isHumasPP = role === 'humas' && connectedOrganization?.type === 'pp'

  if (!isRoot && !isHumasPP) redirect('/dashboard')

  const leadership = await getCachedLeadershipSettings()

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        <div className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
          <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} className='size-6' />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>Pengurus Pusat</h1>
          <p className='text-sm text-muted-foreground leading-relaxed'>
            Kelola data pengurus yang ditampilkan di{' '}
            <span className='font-medium text-foreground'>kammi.id</span>.
          </p>
        </div>
      </div>

      <Card className='rounded-3xl shadow-xs'>
        <CardHeader className='border-b pb-5'>
          <div className='flex items-start justify-between gap-4'>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='font-mono text-xs text-muted-foreground'>01</span>
                <Separator orientation='vertical' className='h-3' />
                <CardTitle className='text-base font-semibold'>Pengurus Pusat</CardTitle>
              </div>
              <CardDescription>
                Nama, jabatan, dan foto pengurus yang ditampilkan di halaman utama.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-6 pb-6'>
          <LeadershipForm initialData={leadership} />
        </CardContent>
      </Card>
    </div>
  )
}

export default ManagersSettingsPage
