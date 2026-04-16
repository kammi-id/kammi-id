'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/shadcn/ui/badge'

export interface DashboardData {
  id: number
  header: string
  type: string
  status: string
  target: string
  limit: string
  reviewer: string
}

export const columns: ColumnDef<DashboardData>[] = [
  {
    accessorKey: 'header',
    header: 'Header'
  },
  {
    accessorKey: 'type',
    header: 'Type'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'Done' ? 'default' : 'secondary'}>
        {row.original.status}
      </Badge>
    )
  },
  {
    accessorKey: 'reviewer',
    header: 'Reviewer'
  }
]
