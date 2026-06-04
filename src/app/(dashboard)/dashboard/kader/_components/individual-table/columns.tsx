'use client'

import React, { useEffect, useState } from 'react'
import { type IndividualMember } from './types'
import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'
import { Badge } from '~/components/shadcn/ui/badge'
import { cn } from '~/lib/shadcn/utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { Chat01Icon, Tick01Icon } from '@hugeicons/core-free-icons'

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

const MemberAvatar = ({
  name,
  photo
}: {
  name: string
  photo: string | null
}) => {
  const isDirectUrl =
    !photo ||
    photo.startsWith('http://') ||
    photo.startsWith('https://') ||
    photo.startsWith('/')
  // Signed URL for S3 keys — fetched asynchronously via server action
  const [signedSrc, setSignedSrc] = useState<string | null>(null)

  useEffect(() => {
    if (isDirectUrl) return
    getSignedUrlAction(photo!).then(setSignedSrc).catch(() => setSignedSrc(null))
  }, [photo, isDirectUrl])

  const src = isDirectUrl ? photo : signedSrc

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
          aria-label='Urutkan berdasarkan NIA'
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={<span>NIA</span>} />
              <TooltipContent>Nomor Induk Anggota</TooltipContent>
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
    ...(orgType === 'pp' ||
    orgType === 'pw' ||
    orgType === 'pd' ||
    orgType === 'pdln'
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
              <span className='cursor-help'>Jenjang</span>
            </TooltipTrigger>
            <TooltipContent>Jenjang Pengkaderan (AB 1, 2, 3)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      cell: ({ row }) => {
        const status = row.original.status
        const badgeStyles: Record<string, React.CSSProperties> = {
          ab1: {
            backgroundColor: 'var(--status-ab1-bg)',
            borderColor: 'var(--status-ab1-border)',
            color: 'var(--status-ab1-text)'
          },
          ab2: {
            backgroundColor: 'var(--status-ab2-bg)',
            borderColor: 'var(--status-ab2-border)',
            color: 'var(--status-ab2-text)'
          },
          ab3: {
            backgroundColor: 'var(--status-ab3-bg)',
            borderColor: 'var(--status-ab3-border)',
            color: 'var(--status-ab3-text)'
          }
        }
        return (
          <button
            type='button'
            onClick={() => onFilterChange?.('status', status)}
            aria-label={`Filter jenjang: ${status.toUpperCase()}`}
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
              <span className='cursor-help'>Jenis Kelamin</span>
            </TooltipTrigger>
            <TooltipContent>Jenis Kelamin (Ikhwan / Akhwat)</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      cell: ({ row }) => {
        const gender = row.original.gender
        const badgeStyles: Record<string, React.CSSProperties> = {
          ikhwan: {
            backgroundColor: 'var(--gender-ikhwan-bg)',
            borderColor: 'var(--gender-ikhwan-border)',
            color: 'var(--gender-ikhwan-text)'
          },
          akhwat: {
            backgroundColor: 'var(--gender-akhwat-bg)',
            borderColor: 'var(--gender-akhwat-border)',
            color: 'var(--gender-akhwat-text)'
          }
        }
        return (
          <button
            type='button'
            onClick={() => onFilterChange?.('gender', gender)}
            aria-label={`Filter jenis kelamin: ${gender}`}
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
      accessorKey: 'isCertifiedMentor',
      header: () => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className='cursor-help'>Pemandu</span>
            </TooltipTrigger>
            <TooltipContent>Bersertifikat Pemandu</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      cell: ({ row }) =>
        row.original.isCertifiedMentor ? (
          <div className='flex justify-center'>
            <HugeiconsIcon
              icon={Tick01Icon}
              className='size-4 [color:var(--status-pass-text)]'
            />
          </div>
        ) : (
          <span className='text-muted-foreground flex justify-center'>—</span>
        )
    },
    {
      accessorKey: 'isCertifiedInstructor',
      header: () => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className='cursor-help'>Instruktur</span>
            </TooltipTrigger>
            <TooltipContent>Bersertifikat Instruktur</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
      cell: ({ row }) =>
        row.original.isCertifiedInstructor ? (
          <div className='flex justify-center'>
            <HugeiconsIcon
              icon={Tick01Icon}
              className='size-4 [color:var(--status-pass-text)]'
            />
          </div>
        ) : (
          <span className='text-muted-foreground flex justify-center'>—</span>
        )
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
              className='[color:var(--status-pass-text)] transition-opacity hover:opacity-80'
            >
              <HugeiconsIcon icon={Chat01Icon} className='size-3.5' />
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
          aria-label='Urutkan berdasarkan Tahun Masuk KAMMI'
        >
          Tahun Masuk KAMMI
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
