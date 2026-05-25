import type { ReactNode } from 'react'
import { DashboardStatsTabs } from './dashboard-stats-tabs'

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
      <DashboardStatsTabs
        kaderContent={kaderContent}
        wilayahContent={wilayahContent}
      />
    )
  }

  if (kaderContent) return <>{kaderContent}</>
  if (wilayahContent) return <>{wilayahContent}</>
  return null
}
