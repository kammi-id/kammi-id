import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pengaturan Halaman Tentang | KAMMI.id',
  description: 'Kelola konten halaman Tentang KAMMI.'
}

import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '~/components/shadcn/ui/card'
import { Separator } from '~/components/shadcn/ui/separator'
import { HeroBgForm } from './_components/hero-bg-form'
import { PrinsipForm } from './_components/prinsip-form'
import { ParadigmaForm } from './_components/paradigma-form'
import { getCachedTentangSettings } from './_data/settings'

const TentangSettingsPage = async () => {
  const session = await readActiveSession()
  if (!session) redirect('/login')

  const { role, connectedOrganization } = session.user
  const isRoot = role === 'root'
  const isHumas = role === 'humas'

  if (!isRoot && !isHumas) redirect('/dashboard')

  const orgId = connectedOrganization?.id
  if (!orgId) redirect('/dashboard')

  const tentang = await getCachedTentangSettings(orgId)

  const sections = [
    {
      id: 'hero',
      title: 'Latar Hero',
      description: 'Gambar latar belakang untuk seksi hero halaman /tentang.',
      content: <HeroBgForm initialData={tentang} />
    },
    {
      id: 'prinsip',
      title: 'Prinsip Gerakan KAMMI',
      description:
        'Gambar latar untuk masing-masing dari enam poin prinsip gerakan.',
      content: <PrinsipForm initialData={tentang} />
    },
    {
      id: 'paradigma',
      title: 'Paradigma Gerakan KAMMI',
      description:
        'Foto untuk masing-masing dari empat poin paradigma gerakan.',
      content: <ParadigmaForm initialData={tentang} />
    }
  ]

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div className='flex items-center gap-4'>
        <div className='bg-primary/10 text-primary ring-primary/5 flex size-12 shrink-0 items-center justify-center rounded-full ring-4'>
          <HugeiconsIcon
            icon={InformationCircleIcon}
            strokeWidth={2}
            className='size-6'
          />
        </div>
        <div>
          <h1 className='font-heading text-3xl font-bold tracking-tight'>
            Pengaturan Halaman Tentang
          </h1>
          <p className='text-muted-foreground text-sm leading-relaxed'>
            Kelola gambar yang ditampilkan di{' '}
            <span className='text-foreground font-medium'>
              kammi.id/tentang
            </span>
            . Perubahan langsung aktif setelah disimpan.
          </p>
        </div>
      </div>

      <div className='space-y-6'>
        {sections.map((section, i) => (
          <Card key={section.id} className='rounded-3xl shadow-xs'>
            <CardHeader className='border-b pb-5'>
              <div className='flex items-start justify-between gap-4'>
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-muted-foreground font-mono text-xs'>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Separator orientation='vertical' className='h-3' />
                    <CardTitle className='text-base font-semibold'>
                      {section.title}
                    </CardTitle>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='pt-6 pb-6'>{section.content}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default TentangSettingsPage
