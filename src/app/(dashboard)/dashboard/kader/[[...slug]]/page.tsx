import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kader | KAMMI.id',
  description: 'Daftar dan manajemen kader organisasi KAMMI.'
}

import { MembersPageContent } from '../_components/members-page-content'

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ slug?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams

  return (
    <MembersPageContent
      params={resolvedParams}
      searchParams={resolvedSearchParams}
      type={undefined}
    />
  )
}
