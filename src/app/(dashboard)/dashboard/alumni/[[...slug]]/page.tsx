import { MembersPageContent } from '../../kader/_components/members-page-content'
import { AccessGuard } from '~/components/access-guard/access-guard'

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
    <AccessGuard allowedRoles={['root', 'bph', 'bpk']}>
      <MembersPageContent
        params={resolvedParams}
        searchParams={resolvedSearchParams}
        type='alumni'
      />
    </AccessGuard>
  )
}
