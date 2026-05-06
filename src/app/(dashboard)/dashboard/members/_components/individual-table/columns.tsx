'use client'

import { type IndividualMember } from './types'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '~/components/shadcn/ui/badge'
import { cn } from '~/lib/shadcn/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserIcon } from '@hugeicons/core-free-icons'

export const getColumns = (type?: string): ColumnDef<IndividualMember>[] => {
  const cols: ColumnDef<IndividualMember>[] = [
    {
      accessorKey: 'name',
      header: 'Nama',
      cell: ({ row }) => {
        const member = row.original
        return (
          <div className='flex items-center gap-2'>
            <div className='bg-muted flex size-8 items-center justify-center rounded-full'>
              <HugeiconsIcon
                icon={UserIcon}
                className='text-muted-foreground size-4'
              />
            </div>
            <span className='font-medium'>{member.name}</span>
          </div>
        )
      }
    },
    {
      accessorKey: 'registerNumber',
      header: 'No. Registrasi',
      cell: ({ row }) => (
        <code className='text-xs'>{row.original.registerNumber}</code>
      )
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
            className={cn(
              'font-bold',
              colors[status] || 'border-slate-200 bg-slate-100 text-slate-700'
            )}
          >
            {status.toUpperCase()}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => {
        const gender = row.original.gender
        const colors: Record<string, string> = {
          ikhwan: 'bg-blue-100 text-blue-700 border-blue-200',
          akhwat: 'bg-pink-100 text-pink-700 border-pink-200'
        }
        return (
          <Badge
            variant='outline'
            className={cn(
              'font-bold',
              colors[gender] || 'border-slate-200 bg-slate-100 text-slate-700'
            )}
          >
            <span className='capitalize'>{gender}</span>
          </Badge>
        )
      }
    },
    {
      accessorKey: 'phone',
      header: 'No. HP',
      cell: ({ row }) => {
        const phone = row.original.phone
        if (!phone) return <span className='text-muted-foreground'>-</span>

        // Clean phone number for WA link (remove non-digits, handle +62/0)
        const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '62')

        return (
          <div className='flex items-center gap-2'>
            <a
              href={`tel:${phone}`}
              className='hover:text-primary transition-colors'
            >
              {phone}
            </a>
            <a
              href={`https://wa.me/${cleanPhone}`}
              target='_blank'
              rel='noopener noreferrer'
              className='text-green-600 hover:text-green-700'
            >
              <HugeiconsIcon
                icon={UserIcon}
                className='size-3.5 text-green-600'
              />
            </a>
          </div>
        )
      }
    },
    {
      accessorKey: 'yearOfEntry',
      header: 'Tahun Masuk',
      cell: ({ row }) => (
        <div className='text-center'>{row.original.yearOfEntry}</div>
      )
    }
  ]

  if (type === 'pemandu' || type === 'instruktur' || type === 'alumni') {
    return cols.filter((col) => col.accessorKey !== 'status')
  }

  return cols
}

export const columns = getColumns()
