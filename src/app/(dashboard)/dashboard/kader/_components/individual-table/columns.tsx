'use client'

import { type IndividualMember } from './types'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Badge } from '~/components/shadcn/ui/badge'
import { cn } from '~/lib/shadcn/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { Chat01Icon, UserIcon } from '@hugeicons/core-free-icons'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '~/components/shadcn/ui/tooltip'

export const getColumns = (
  type?: string,
  orgType?: string,
  onFilterChange?: (type: 'status' | 'gender', value: string) => void,
  onSortChange?: (columnId: string) => void
): ColumnDef<IndividualMember>[] => {
  const cols: ColumnDef<IndividualMember>[] = [
    {
      accessorKey: 'registerNumber',
      header: () => (
        <div
          className='hover:text-primary flex cursor-pointer items-center gap-1 transition-colors'
          onClick={() => onSortChange?.('registerNumber')}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>NIK</span>
              </TooltipTrigger>
              <TooltipContent>Nomor Induk Kader</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
      cell: ({ row }) => (
        <span className='font-mono text-xs'>{row.original.registerNumber}</span>
      )
    },
    {
      accessorKey: 'name',
      header: () => (
        <div
          className='hover:text-primary cursor-pointer transition-colors'
          onClick={() => onSortChange?.('name')}
        >
          Nama
        </div>
      ),
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
            <Link
              href={`/dashboard/profile/${member.registerNumber}`}
              className='text-foreground hover:text-primary font-semibold transition-colors'
            >
              {member.name}
            </Link>
          </div>
        )
      }
    },
    {
      accessorKey: 'organization',
      header:
        orgType === 'pk'
          ? 'Komisariat'
          : orgType === 'pw'
            ? 'PD'
            : orgType === 'pd'
              ? 'PK'
              : 'PW/PD/PDLN/PK',
      cell: ({ row }) => (
        <span className='text-xs'>
          {row.original.organization?.name || '-'}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: () => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className='cursor-help'>Status</span>
            </TooltipTrigger>
            <TooltipContent>Tahap Kaderisasi (AB 1, 2, 3)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      cell: ({ row }) => {
        const status = row.original.status
        const colors: Record<string, string> = {
          ab1: 'border-muted-foreground/20 text-muted-foreground bg-muted/50',
          ab2: 'border-primary/30 text-primary/80 bg-primary/5',
          ab3: 'border-primary text-primary bg-primary/10'
        }
        return (
          <Badge
            variant='outline'
            className={cn(
              'cursor-pointer font-bold transition-opacity hover:opacity-80',
              colors[status] || 'border-slate-200 bg-slate-100 text-slate-700'
            )}
            onClick={() => onFilterChange?.('status', status)}
          >
            {status.toUpperCase()}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'gender',
      header: () => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className='cursor-help'>Gender</span>
            </TooltipTrigger>
            <TooltipContent>Jenis Kelamin (Ikhwan / Akhwat)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      cell: ({ row }) => {
        const gender = row.original.gender
        const colors: Record<string, string> = {
          ikhwan:
            'border-muted-foreground/20 text-muted-foreground bg-muted/50',
          akhwat: 'border-primary/30 text-primary/80 bg-primary/5'
        }
        return (
          <Badge
            variant='outline'
            className={cn(
              'cursor-pointer font-bold transition-opacity hover:opacity-80',
              colors[gender] || 'border-slate-200 bg-slate-100 text-slate-700',
              'capitalize'
            )}
            onClick={() => onFilterChange?.('gender', gender)}
          >
            {gender}
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
                icon={Chat01Icon}
                className='size-3.5 text-green-600'
              />
            </a>
          </div>
        )
      }
    },
    {
      accessorKey: 'yearOfEntry',
      header: () => (
        <div
          className='hover:text-primary cursor-pointer transition-colors'
          onClick={() => onSortChange?.('yearOfEntry')}
        >
          Tahun Masuk
        </div>
      ),
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
