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
import { Input } from '~/components/shadcn/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { Checkbox } from '~/components/shadcn/ui/checkbox'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxGroup,
  ComboboxList,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'
import { setRowEdit } from '../add-form/store'

type OrgRef = { id: string; name: string; slug: string } | null

const getDescendantIds = (
  parentId: string,
  allOrgs: { id: string; parentId?: string | null }[]
): string[] => {
  const descendants: string[] = []
  const children = allOrgs.filter((org) => org.parentId === parentId)
  children.forEach((child) => {
    descendants.push(child.id)
    descendants.push(...getDescendantIds(child.id, allOrgs))
  })
  return descendants
}

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
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!photo) {
      setSrc(null)
      return
    }
    if (
      photo.startsWith('http://') ||
      photo.startsWith('https://') ||
      photo.startsWith('/')
    ) {
      setSrc(photo)
      return
    }
    getSignedUrlAction(photo)
      .then(setSrc)
      .catch(() => setSrc(null))
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
  onSortChange?: (columnId: string) => void,
  isEditMode = false,
  editedRows: Record<string, Partial<IndividualMember>> = {},
  organizations: {
    id: string
    name: string
    type: string
    parentId?: string | null
  }[] = [],
  parentOrgId = ''
): ColumnDef<IndividualMember>[] => {
  const filteredOrganizations = organizations.filter((org) => {
    const descendants = getDescendantIds(parentOrgId, organizations)
    const isCorrectType = org.type === 'pd' || org.type === 'pk'
    const isDescendant = descendants.includes(org.id) || org.id === parentOrgId
    return isCorrectType && isDescendant
  })

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
        const edited = editedRows[member.id]

        if (isEditMode) {
          return (
            <Input
              defaultValue={edited?.name ?? member.name}
              className='h-8 px-2 py-0 text-xs focus-visible:ring-1'
              onChange={(e) => setRowEdit(member.id, { name: e.target.value })}
            />
          )
        }

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
            cell: ({ row }: { row: { original: IndividualMember } }) => {
              const member = row.original
              const edited = editedRows[member.id]

              if (isEditMode && (orgType as string) !== 'pk') {
                const currentOrgId =
                  edited?.organizationId ?? member.organizationId
                const currentOrg = filteredOrganizations.find(
                  (org) => org.id === currentOrgId
                )
                return (
                  <Combobox
                    value={currentOrgId}
                    onValueChange={(val) => {
                      if (val) setRowEdit(member.id, { organizationId: val })
                    }}
                  >
                    <ComboboxInput
                      placeholder='Pilih PD/PK'
                      value={currentOrg?.name ?? ''}
                    />
                    <ComboboxContent>
                      <ComboboxList>
                        {filteredOrganizations.length === 0 ? (
                          <ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty>
                        ) : (
                          <ComboboxGroup>
                            {filteredOrganizations.map((org) => (
                              <ComboboxItem key={org.id} value={org.id}>
                                {org.name}
                              </ComboboxItem>
                            ))}
                          </ComboboxGroup>
                        )}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                )
              }

              return <OrgCell org={member.orgHierarchy?.pk ?? null} />
            }
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
        const member = row.original
        const edited = editedRows[member.id]
        const status = edited?.status ?? member.status
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

        if (isEditMode) {
          return (
            <Select
              value={status}
              onValueChange={(val) =>
                setRowEdit(member.id, { status: val as 'ab1' | 'ab2' | 'ab3' })
              }
            >
              <SelectTrigger className='h-8 text-xs'>
                <SelectValue placeholder='Jenjang'>
                  {status === 'ab1' && 'AB 1'}
                  {status === 'ab2' && 'AB 2'}
                  {status === 'ab3' && 'AB 3'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ab1'>AB 1</SelectItem>
                <SelectItem value='ab2'>AB 2</SelectItem>
                <SelectItem value='ab3'>AB 3</SelectItem>
              </SelectContent>
            </Select>
          )
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
        const member = row.original
        const edited = editedRows[member.id]
        const gender = edited?.gender ?? member.gender
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

        if (isEditMode) {
          return (
            <Select
              value={gender}
              onValueChange={(val) =>
                setRowEdit(member.id, {
                  gender: val as 'ikhwan' | 'akhwat'
                })
              }
            >
              <SelectTrigger className='h-8 text-xs'>
                <SelectValue placeholder='Jenis Kelamin'>
                  {gender === 'ikhwan' && 'Ikhwan'}
                  {gender === 'akhwat' && 'Akhwat'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ikhwan'>Ikhwan</SelectItem>
                <SelectItem value='akhwat'>Akhwat</SelectItem>
              </SelectContent>
            </Select>
          )
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
      cell: ({ row }) => {
        const member = row.original
        const edited = editedRows[member.id]
        const isCertifiedMentor =
          edited?.isCertifiedMentor ?? member.isCertifiedMentor

        if (isEditMode) {
          return (
            <div className='flex justify-center'>
              <Checkbox
                checked={isCertifiedMentor}
                onCheckedChange={(val) =>
                  setRowEdit(member.id, { isCertifiedMentor: !!val })
                }
                aria-label='Pemandu'
              />
            </div>
          )
        }

        return isCertifiedMentor ? (
          <div className='flex justify-center'>
            <HugeiconsIcon
              icon={Tick01Icon}
              className='size-4 [color:var(--status-pass-text)]'
            />
          </div>
        ) : (
          <span className='text-muted-foreground flex justify-center'>—</span>
        )
      }
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
      cell: ({ row }) => {
        const member = row.original
        const edited = editedRows[member.id]
        const isCertifiedInstructor =
          edited?.isCertifiedInstructor ?? member.isCertifiedInstructor

        if (isEditMode) {
          return (
            <div className='flex justify-center'>
              <Checkbox
                checked={isCertifiedInstructor}
                onCheckedChange={(val) =>
                  setRowEdit(member.id, { isCertifiedInstructor: !!val })
                }
                aria-label='Instruktur'
              />
            </div>
          )
        }

        return isCertifiedInstructor ? (
          <div className='flex justify-center'>
            <HugeiconsIcon
              icon={Tick01Icon}
              className='size-4 [color:var(--status-pass-text)]'
            />
          </div>
        ) : (
          <span className='text-muted-foreground flex justify-center'>—</span>
        )
      }
    },
    {
      accessorKey: 'phone',
      header: 'No. HP',
      cell: ({ row }) => {
        const member = row.original
        const edited = editedRows[member.id]
        const phone = edited?.phone ?? member.phone

        if (isEditMode) {
          return (
            <Input
              defaultValue={phone ?? ''}
              placeholder='No. HP'
              className='h-8 px-2 py-0 text-xs focus-visible:ring-1'
              onChange={(e) => setRowEdit(member.id, { phone: e.target.value })}
            />
          )
        }

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
      cell: ({ row }) => {
        const member = row.original
        const edited = editedRows[member.id]
        const yearOfEntry = edited?.yearOfEntry ?? member.yearOfEntry
        const currentYear = new Date().getFullYear()

        if (isEditMode) {
          return (
            <Input
              type='number'
              min={1998}
              max={currentYear}
              defaultValue={yearOfEntry}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                if (!Number.isNaN(val)) {
                  setRowEdit(member.id, { yearOfEntry: val })
                }
              }}
              onBlur={(e) => {
                const val = parseInt(e.target.value)
                if (Number.isNaN(val)) return
                const clamped = Math.min(Math.max(val, 1998), currentYear)
                if (clamped !== val) {
                  setRowEdit(member.id, { yearOfEntry: clamped })
                }
              }}
              className='h-8 w-20 px-2 py-0 text-center text-xs focus-visible:ring-1'
            />
          )
        }

        return <div className='text-center'>{yearOfEntry}</div>
      }
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
