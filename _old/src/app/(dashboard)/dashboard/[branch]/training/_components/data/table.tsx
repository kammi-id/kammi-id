'use client'

import type { JSX, ComponentPropsWithoutRef as ComponentProps } from 'react'
import Table from '~/components/common/table'
import { Button } from '~/components/shadcn/ui/button'
import { Badge } from '~/components/shadcn/ui/badge'
import Link from 'next/link'
import type { ColumnDef } from '@tanstack/react-table'
import type { Training } from '~/app/(dashboard)/dashboard/_data/training'
import { formatDate } from '~/lib/helper/date'
import { usePathname } from 'next/navigation'

const trainingTypeLabels: Record<string, string> = {
  dm1: 'Dauroh Marhalah 1',
  dm2: 'Dauroh Marhalah 2',
  dm3: 'Dauroh Marhalah 3',
  tfi: 'Training For Instructors',
  dpmk: 'Dauroh Pemandu Madrasah KAMMI',
  other: 'Dauroh Suplemen/Pelatihan Lainnya'
}

type TrainingTableProps = {
  data: Array<Training>
} & ComponentProps<'div'>

const columns: Array<ColumnDef<Training>> = [
  {
    accessorKey: 'name',
    header: 'Nama',
    cell: (c) => {
      const name = c.getValue() as string
      const pathname = usePathname()

      return (
        <Button
          variant='link'
          nativeButton={false}
          render={<Link href={`${pathname}/${c.cell.row.original.serial}`} />}
        >
          {name}
        </Button>
      )
    }
  },
  {
    accessorKey: 'type',
    header: 'Jenis',
    cell: (c) => {
      const type = c.getValue() as string
      return <Badge variant='outline'>{trainingTypeLabels[type] ?? type}</Badge>
    }
  },
  {
    accessorKey: 'organizer',
    header: 'Penyelenggara',
    cell: (c) => {
      const organizer = c.getValue() as { name: string } | null
      return organizer?.name ?? '—'
    }
  },
  {
    accessorKey: 'attendantsCount',
    header: 'Jumlah Peserta',
    cell: (c) => (c.getValue() as number) ?? 0
  },
  {
    accessorKey: 'dateStart',
    header: 'Tanggal Mulai',
    cell: (c) => formatDate(c.getValue())
  },
  {
    accessorKey: 'dateEnd',
    header: 'Tanggal Selesai',
    cell: (c) => formatDate(c.getValue())
  },
  {
    accessorKey: 'registrationUntil',
    header: 'Pendaftaran Hingga',
    cell: (c) => formatDate(c.getValue())
  }
]

const TrainingTable = ({ data, ...props }: TrainingTableProps): JSX.Element => {
  return <Table columns={columns} data={data} {...props} />
}

export default TrainingTable
