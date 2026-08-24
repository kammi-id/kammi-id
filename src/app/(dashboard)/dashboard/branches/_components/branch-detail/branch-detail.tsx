import Link from 'next/link'
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '~/components/shadcn/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '~/components/shadcn/ui/breadcrumb'
import {
  StrukturAktifBadge,
  StrukturJenjangBadge,
  StrukturNonAktifBadge
} from '../struktur-badges'
import type { BranchDetail } from './data'

export const BranchDetailView = ({ detail }: { detail: BranchDetail }) => {
  const { organization, breadcrumbs, parent } = detail

  return (
    <div className='flex flex-col gap-8 px-4 py-4 md:py-6 lg:px-6'>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href='/dashboard/branches' />}>
              Struktur Anak
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((breadcrumb, index) => {
            const href = `/dashboard/branches/${breadcrumbs
              .slice(0, index + 1)
              .map(({ slug }) => slug)
              .join('/')}`
            const isCurrent = breadcrumb.id === organization.id

            return (
              <BreadcrumbItem key={breadcrumb.id}>
                <BreadcrumbSeparator />
                {isCurrent ? (
                  <BreadcrumbPage>{breadcrumb.name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>
                    {breadcrumb.name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <section className='bg-card rounded-3xl border p-6 shadow-xs md:p-8'>
        <div className='flex flex-col gap-6 sm:flex-row sm:items-start'>
          <Avatar className='size-16 rounded-2xl'>
            <AvatarImage
              src={
                organization.logo
                  ? `/api/images/${organization.logo}`
                  : undefined
              }
              alt={`Logo ${organization.name}`}
              className='rounded-2xl'
            />
            <AvatarFallback className='rounded-2xl text-lg font-semibold'>
              {organization.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className='flex min-w-0 flex-1 flex-col gap-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <StrukturJenjangBadge type={organization.type} />
              {organization.state === 'non_aktif' ? (
                <StrukturNonAktifBadge />
              ) : (
                <StrukturAktifBadge />
              )}
            </div>
            <div>
              <h1 className='font-heading text-3xl font-bold tracking-tight sm:text-4xl'>
                {organization.name}
              </h1>
              <p className='text-muted-foreground mt-2'>
                Detail identitas Struktur dalam Cakupan Antum.
              </p>
            </div>
            <dl className='grid gap-4 text-sm sm:grid-cols-3'>
              <div>
                <dt className='text-muted-foreground'>Kode</dt>
                <dd className='font-geist-mono mt-1 font-medium'>
                  {organization.code}
                </dd>
              </div>
              <div>
                <dt className='text-muted-foreground'>Jenjang</dt>
                <dd className='mt-1 font-medium'>
                  <StrukturJenjangBadge type={organization.type} />
                </dd>
              </div>
              {parent && (
                <div>
                  <dt className='text-muted-foreground'>Induk</dt>
                  <dd className='mt-1 font-medium'>{parent.name}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </section>
    </div>
  )
}
