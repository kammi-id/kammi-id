'use client'

import { DataTable } from '~/app/(dashboard)/dashboard/_components/data-table/data-table'
import { getColumns, type Training } from './columns'

interface TrainingTableProps {
  data: Training[]
}

export const TrainingTable = ({ data }: TrainingTableProps) => {
  return <DataTable data={data} columns={getColumns()} />
}
