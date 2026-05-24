'use client'

import React, { useEffect, useState } from 'react'
import { type IndividualMember } from './types'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Badge } from '~/components/shadcn/ui/badge'
import { cn } from '~/lib/shadcn/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { Chat01Icon } from '@hugeicons/core-free-icons'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '~/components/shadcn/ui/tooltip'
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from '~/components/shadcn/ui/avatar'
import { getSignedUrlAction } from '~/lib/actions/storage'

type OrgRef = { id: string; name: string; slug: string } | null

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const MemberAvatar = ({ name, photo }: { name: string; photo: string | null }) => {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!photo) { setSrc(null); return }
    if (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('/')) {
      setSrc(photo); return
    }
    getSignedUrlAction(photo).then(setSrc).catch(() => setSrc(null))
  }, [photo])

  return (
    <Avatar className='size-8'>
      {src && <AvatarImage src={src} alt={`Foto ${name}`} />}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  )
}

const OrgCell = ({ org }: { org: OrgRef }) => {
  if (!org) return <span className='text-muted-foreground text-xs'>-</span>
  return (
    <Link
      href={`/dashboard/kader/${org.slug}`}
      title={org.name}
      className='text-foreground hover:text-primary text-xs transition-colors'
    >
      {org.name}
    </Link>
  )
}

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
        <button
          type='button'
          className='hover:text-primary flex cursor-pointer items-center gap-1 transition-colors'
          onClick={() => onSortChange?.('registerNumber')}
          aria-label='Urutkan berdasarkan NIK'
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={<span>NIK</span>} />
              <TooltipContent>Nomor Induk Kader</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </button>
      ),
      cell: ({ row }) => (
        <span className='font-mono text-xs'>{row.original.registerNumber}</span>
      )
    },
    {
      accessorKey: 'name',
      header: () => (
        <button
          type='button'
          className='hover:text-primary cursor-pointer transition-colors'
          onClick={() => onSortChange?.('name')}
          aria-label='Urutkan berdasarkan Nama'
        >
          Nama
        </button>
      ),
      cell: ({ row }) => {
        const member = row.original
        return (
          <div className='flex items-center gap-2'>
            <MemberAvatar name={member.name} photo={member.photo} />
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
    ...(orgType === 'pp'
      ? [
          {
            id: 'orgWilayah',
            header: 'Wilayah',
            cell: ({ row }: { row: { original: IndividualMember } }) => (
              <OrgCell org={row.original.orgHierarchy?.pw ?? null} />
            )
          } as ColumnDef<IndividualMember>
        ]
      : []),
    ...(orgType === 'pp' || orgType === 'pw'
      ? [
          {
            id: 'orgDaerah',
            header: 'Daerah',
            cell: ({ row }: { row: { original: IndividualMember } }) => (
              <OrgCell org={row.original.orgHierarchy?.pd ?? null} />
            )
          } as ColumnDef<IndividualMember>
        ]
      : []),
    ...(orgType === 'pp' || orgType === 'pw' || orgType === 'pd' || orgType === 'pdln'
      ? [
          {
            id: 'orgKomisariat',
            header: 'Komisariat',
            cell: ({ row }: { row: { original: IndividualMember } }) => (
              <OrgCell org={row.original.orgHierarchy?.pk ?? null} />
            )
          } as ColumnDef<IndividualMember>
        ]
      : []),
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
        const badgeStyles: Record<string, React.CSSProperties> = {
          ab1: {
            backgroundColor: 'oklch(0.65 0.18 145 / 0.12)',
            borderColor: 'oklch(0.55 0.16 145 / 0.40)',
            color: 'oklch(0.40 0.16 145)'
          },
          ab2: {
            backgroundColor: 'oklch(0.58 0.20 25 / 0.12)',
            borderColor: 'oklch(0.48 0.18 25 / 0.40)',
            color: 'oklch(0.42 0.18 25)'
          },
          ab3: {
            backgroundColor: 'oklch(0.55 0.18 265 / 0.12)',
            borderColor: 'oklch(0.42 0.17 265 / 0.40)',
            color: 'oklch(0.38 0.17 265)'
          }
        }
        return (
          <button
            type='button'
            onClick={() => onFilterChange?.('status', status)}
            aria-label={`Filter status: ${status.toUpperCase()}`}
            className='cursor-pointer transition-opacity hover:opacity-80'
          >
            <Badge
              variant='outline'
              className={cn('pointer-events-none font-bold')}
              style={badgeStyles[status]}
            >
              {status.toUpperCase()}
            </Badge>
          </button>
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
        const badgeStyles: Record<string, React.CSSProperties> = {
          ikhwan: {
            backgroundColor: 'oklch(0.72 0.14 225 / 0.12)',
            borderColor: 'oklch(0.55 0.13 225 / 0.40)',
            color: 'oklch(0.40 0.13 225)'
          },
          akhwat: {
            backgroundColor: 'oklch(0.74 0.14 350 / 0.12)',
            borderColor: 'oklch(0.58 0.13 350 / 0.40)',
            color: 'oklch(0.46 0.14 350)'
          }
        }
        return (
          <button
            type='button'
            onClick={() => onFilterChange?.('gender', gender)}
            aria-label={`Filter gender: ${gender}`}
            className='cursor-pointer transition-opacity hover:opacity-80'
          >
            <Badge
              variant='outline'
              className={cn('pointer-events-none font-bold capitalize')}
              style={badgeStyles[gender]}
            >
              {gender}
            </Badge>
          </button>
        )
      }
    },
    {
      accessorKey: 'phone',
      header: 'No. HP',
      cell: ({ row }) => {
        const phone = row.original.phone
        if (!phone) return <span className='text-muted-foreground'>-</span>

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
              aria-label={`WhatsApp ${phone}`}
              className='[color:var(--status-pass-text)] hover:opacity-80 transition-opacity'
            >
              <HugeiconsIcon
                icon={Chat01Icon}
                className='size-3.5'
              />
            </a>
          </div>
        )
      }
    },
    {
      accessorKey: 'yearOfEntry',
      header: () => (
        <button
          type='button'
          className='hover:text-primary cursor-pointer transition-colors'
          onClick={() => onSortChange?.('yearOfEntry')}
          aria-label='Urutkan berdasarkan Tahun Masuk'
        >
          Tahun Masuk
        </button>
      ),
      cell: ({ row }) => (
        <div className='text-center'>{row.original.yearOfEntry}</div>
      )
    }
  ]

  if (type === 'pemandu' || type === 'instruktur' || type === 'alumni') {
    return cols.filter(
      (col) => (col as { accessorKey?: string }).accessorKey !== 'status'
    )
  }

  return cols
}

export const columns = getColumns()
