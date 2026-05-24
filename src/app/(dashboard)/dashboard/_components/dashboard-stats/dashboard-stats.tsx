'use client'

import type { ReactNode } from 'react'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '~/components/shadcn/ui/tabs'

export const DashboardStats = ({
  role,
  kaderContent,
  wilayahContent
}: {
  role: string
  kaderContent: ReactNode | null
  wilayahContent: ReactNode | null
}) => {
  const showBoth = ['root', 'bph'].includes(role)

  if (showBoth && kaderContent && wilayahContent) {
    return (
      <Tabs defaultValue='kader'>
        <TabsList>
          <TabsTrigger value='kader'>Kader</TabsTrigger>
          <TabsTrigger value='wilayah'>Wilayah</TabsTrigger>
        </TabsList>
        <TabsContent value='kader' className='mt-4'>
          {kaderContent}
        </TabsContent>
        <TabsContent value='wilayah' className='mt-4'>
          {wilayahContent}
        </TabsContent>
      </Tabs>
    )
  }

  if (kaderContent) return <>{kaderContent}</>
  if (wilayahContent) return <>{wilayahContent}</>
  return null
}
