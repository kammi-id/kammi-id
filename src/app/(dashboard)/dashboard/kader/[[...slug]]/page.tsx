import { MembersPageContent } from '../_components/members-page-content'

const Page = async ({
  params,
  searchParams
}: {
  params: Promise<{ slug?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
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

export default Page
