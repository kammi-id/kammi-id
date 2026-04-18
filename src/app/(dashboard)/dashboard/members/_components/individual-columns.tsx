'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/shadcn/ui/badge'
import { cn } from '~/lib/shadcn/utils'
import { UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

export interface IndividualMember {
  id: string
  name: string
  phone: string | null
  registerNumber: string
  status: 'ab1' | 'ab2' | 'ab3'
  gender: 'ikhwan' | 'akhwat'
  yearOfEntry: number
  organization: {
    id: string
    name: string
    slug: string
  }
}

export const columns: ColumnDef<IndividualMember>[] = [
  {
    accessorKey: 'name',
    header: 'Nama',
    cell: ({ row }) => {
      const member = row.original
      return (
        <div className='flex items-center gap-2'>
          <div className='bg-muted flex size-8 items-center justify-center rounded-full'>
            <HugeiconsIcon icon={UserIcon} className='text-muted-foreground size-4' />
          </div>
          <span className='font-medium'>{member.name}</span>
        </div>
      )
    }
  },
  {
    accessorKey: 'registerNumber',
    header: 'No. Registrasi',
    cell: ({ row }) => <code className='text-xs'>{row.original.registerNumber}</code>
  },
  {
    id: 'organization',
    accessorKey: 'organization.name',
    header: 'Organisasi'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const colors: Record<string, string> = {
        ab1: 'bg-blue-100 text-blue-700 border-blue-200',
        ab2: 'bg-red-100 text-red-700 border-red-200',
        ab3: 'bg-green-100 text-green-700 border-green-200'
      }
      return (
        <Badge
          variant='outline'
          className={cn('font-bold', colors[status] || 'border-slate-200 bg-slate-100 text-slate-700')}
        >
          {status.toUpperCase()}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'gender',
    header: 'Gender',
    cell: ({ row }) => <span className='capitalize'>{row.original.gender}</span>
  },
  {
    accessorKey: 'phone',
    header: 'No. HP',
    cell: ({ row }) => {
      const phone = row.original.phone
      if (!phone) return <span className='text-muted-foreground'>-</span>
      return (
        <a href={`tel:${phone}`} className='hover:underline'>
          {phone}
        </a>
      )
    }
  },
  {
    accessorKey: 'yearOfEntry',
    header: 'Tahun Masuk',
    cell: ({ row }) => <div className='text-center'>{row.original.yearOfEntry}</div>
  }
]
