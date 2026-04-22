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
  addressProvinceCode: string | null
  addressCityCode: string | null
  addressDistrictCode: string | null
  addressSubdistrictCode: string | null
  addressLine: string | null
  isAlumn: boolean
  isSuspended: boolean
  isNonActive: boolean
  isCertifiedMentor: boolean
  isCertifiedInstructor: boolean
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
            <svg className='size-3.5 fill-current' viewBox='0 0 24 24'>
              <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.353-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.87 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.163-1.617a11.804 11.804 0 005.883 1.564h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' />
            </svg>
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
