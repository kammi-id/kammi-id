'use client'

import type { ReactNode } from 'react'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '~/components/shadcn/ui/tabs'

export const DashboardTabs = ({
  kaderContent,
  wilayahContent
}: {
  kaderContent: ReactNode
  wilayahContent: ReactNode
}) => {
  return (
    <Tabs defaultValue='kader'>
      <TabsList>
        <TabsTrigger value='kader'>Kader</TabsTrigger>
        <TabsTrigger value='wilayah'>Wilayah</TabsTrigger>
      </TabsList>
      <TabsContent value='kader'>{kaderContent}</TabsContent>
      <TabsContent value='wilayah'>{wilayahContent}</TabsContent>
    </Tabs>
  )
}
