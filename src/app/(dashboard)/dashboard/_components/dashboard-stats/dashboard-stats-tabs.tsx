'use client'

import type { ReactNode } from 'react'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '~/components/shadcn/ui/tabs'

export const DashboardStatsTabs = ({
  kaderContent,
  wilayahContent
}: {
  kaderContent: ReactNode
  wilayahContent: ReactNode
}) => (
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
