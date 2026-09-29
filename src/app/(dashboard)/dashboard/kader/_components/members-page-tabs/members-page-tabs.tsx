import React from 'react'
import Link from 'next/link'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '~/components/shadcn/ui/tabs'

interface MembersPageTabsProps {
  activeTab: string
  basePath: string
  activeType?: string
  showSummary: boolean
  showIndividuals: boolean
  renderSummary: () => React.ReactNode
  renderIndividuals: () => React.ReactNode
}

export const MembersPageTabs = ({
  activeTab,
  basePath,
  activeType,
  showSummary,
  showIndividuals,
  renderSummary,
  renderIndividuals
}: MembersPageTabsProps) => {
  if (!showSummary && !showIndividuals) return null

  if (showSummary && showIndividuals) {
    return (
      <Tabs value={activeTab} className='space-y-8'>
        <TabsList className='bg-background w-full justify-start rounded-none border-b p-0'>
          <TabsTrigger
            value='kader'
            className='text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-primary/10 relative h-12 rounded-none bg-transparent px-4 pt-2 pb-3 font-semibold shadow-none transition-all data-[state=active]:shadow-none'
            render={<Link href={`${basePath}?tab=kader`} />}
          >
            Ringkasan Struktur
          </TabsTrigger>
          <TabsTrigger
            value='individuals'
            className='text-muted-foreground data-[state=active]:text-primary data-[state=active]:bg-primary/10 relative h-12 rounded-none bg-transparent px-4 pt-2 pb-3 font-semibold shadow-none transition-all data-[state=active]:shadow-none'
            render={
              <Link
                href={`${basePath}?tab=individuals${activeType ? `&type=${activeType}` : ''}`}
              />
            }
          >
            Daftar Kader
          </TabsTrigger>
        </TabsList>

        <TabsContent value='kader' className='m-0 border-none p-0 outline-none'>
          {renderSummary()}
        </TabsContent>

        <TabsContent
          value='individuals'
          className='m-0 border-none p-0 outline-none'
        >
          {renderIndividuals()}
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <div className='space-y-12'>
      {showSummary && renderSummary()}
      {showIndividuals && renderIndividuals()}
    </div>
  )
}
