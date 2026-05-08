import { MembersPageContent } from '../_components/MembersPageContent'

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
