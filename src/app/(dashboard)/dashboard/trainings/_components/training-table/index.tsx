'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel
} from '@tanstack/react-table'
import { DataTable } from '~/app/(dashboard)/dashboard/_components/data-table/data-table'
import { getColumns, type Training } from './columns'
import { toast } from 'sonner'

interface TrainingTableProps {
  data: Training[]
  onEdit?: (training: Training) => void
  onDelete?: (id: string) => void
}

export const TrainingTable = ({
  data,
  onEdit,
  onDelete
}: TrainingTableProps) => {
  const columns = getColumns(onEdit, onDelete)

  return <DataTable data={data} columns={columns} />
}
