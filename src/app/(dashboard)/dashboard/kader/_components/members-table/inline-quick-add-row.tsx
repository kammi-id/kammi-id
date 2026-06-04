'use client'

import * as React from 'react'
import { TableRow, TableCell } from '~/components/shadcn/ui/table'
import { useStore } from '@nanostores/react'
import {
  inlineMembersStore,
  updateInlineRow,
  removeInlineRow,
  type InlineRow
} from '../add-form/store'
import { type IndividualMember } from '../individual-table/types'
import { Button } from '~/components/shadcn/ui/button'
import { Close, AddIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Input } from '~/components/shadcn/ui/input'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxGroup,
  ComboboxList,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { Checkbox } from '~/components/shadcn/ui/checkbox'

interface Organization {
  id: string
  name: string
  type: string
  parentId?: string | null
}

interface InlineQuickAddRowProps {
  organizations: Organization[]
  parentOrgId: string
  type?: string
  orgType?: string
}

interface InlineRowProps {
  member: InlineRow
  index: number
  filteredOrganizations: Organization[]
  currentYear: number
  orgColCount: number
}

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

const InlineRow = ({
  member,
  index,
  filteredOrganizations,
  currentYear,
  orgColCount
}: InlineRowProps) => {
  const [searchQuery, setSearchQuery] = React.useState('')

  const isEmpty = !member.name?.trim() || !member.organizationId

  const selectedOrg = React.useMemo(
    () =>
      filteredOrganizations.find((org) => org.id === member.organizationId) ??
      null,
    [filteredOrganizations, member.organizationId]
  )

  const visibleOrgs = React.useMemo(() => {
    if (!searchQuery) return filteredOrganizations
    return filteredOrganizations.filter((org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [filteredOrganizations, searchQuery])

  return (
    <TableRow
      data-empty={isEmpty || undefined}
      className='group bg-primary/5 hover:bg-primary/10 data-[empty]:bg-destructive/5 data-[empty]:hover:bg-destructive/8 transition-colors'
    >
      <TableCell className='p-2'>
        <div className='text-muted-foreground text-center text-xs italic'>
          Auto
        </div>
      </TableCell>
      <TableCell className='p-2'>
        <Input
          value={member.name ?? ''}
          placeholder='Nama lengkap'
          className='h-8 px-2 py-0 text-xs focus-visible:ring-1'
          onChange={(e) => updateInlineRow(index, { name: e.target.value })}
        />
      </TableCell>
      {orgColCount > 0 && (
        <TableCell className='p-2' colSpan={orgColCount}>
          <Combobox
            value={member.organizationId ?? undefined}
            onValueChange={(val) => {
              if (val) updateInlineRow(index, { organizationId: val })
              setSearchQuery('')
            }}
          >
            <ComboboxInput
              placeholder='Pilih PD/PK'
              value={selectedOrg?.name ?? searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <ComboboxContent>
              <ComboboxList>
                {visibleOrgs.length === 0 ? (
                  <ComboboxEmpty>Data tidak ditemukan.</ComboboxEmpty>
                ) : (
                  <ComboboxGroup>
                    {visibleOrgs.map((org) => (
                      <ComboboxItem key={org.id} value={org.id}>
                        {org.name}
                      </ComboboxItem>
                    ))}
                  </ComboboxGroup>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </TableCell>
      )}
      <TableCell className='p-2'>
        <Select
          value={member.status ?? undefined}
          onValueChange={(val) =>
            updateInlineRow(index, { status: val as 'ab1' | 'ab2' | 'ab3' })
          }
        >
          <SelectTrigger className='h-8 text-xs'>
            <SelectValue placeholder='Jenjang'>
              {member.status === 'ab1' && 'AB 1'}
              {member.status === 'ab2' && 'AB 2'}
              {member.status === 'ab3' && 'AB 3'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ab1'>AB 1</SelectItem>
            <SelectItem value='ab2'>AB 2</SelectItem>
            <SelectItem value='ab3'>AB 3</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className='p-2'>
        <Select
          value={member.gender ?? undefined}
          onValueChange={(val) =>
            updateInlineRow(index, { gender: val as 'ikhwan' | 'akhwat' })
          }
        >
          <SelectTrigger className='h-8 text-xs'>
            <SelectValue placeholder='Jenis Kelamin'>
              {member.gender === 'ikhwan' && 'Ikhwan'}
              {member.gender === 'akhwat' && 'Akhwat'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ikhwan'>Ikhwan</SelectItem>
            <SelectItem value='akhwat'>Akhwat</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className='p-2'>
        <div className='flex justify-center'>
          <Checkbox
            checked={member.isCertifiedMentor ?? false}
            onCheckedChange={(val) =>
              updateInlineRow(index, { isCertifiedMentor: !!val })
            }
            aria-label='Pemandu'
          />
        </div>
      </TableCell>
      <TableCell className='p-2'>
        <div className='flex justify-center'>
          <Checkbox
            checked={member.isCertifiedInstructor ?? false}
            onCheckedChange={(val) =>
              updateInlineRow(index, { isCertifiedInstructor: !!val })
            }
            aria-label='Instruktur'
          />
        </div>
      </TableCell>
      <TableCell className='p-2'>
        <Input
          value={member.phone ?? ''}
          onChange={(e) => updateInlineRow(index, { phone: e.target.value })}
          placeholder='No. HP'
          className='h-8 px-2 py-0 text-xs focus-visible:ring-1'
        />
      </TableCell>
      <TableCell className='p-2'>
        <div className='flex items-center gap-2'>
          <Input
            type='number'
            value={member.yearOfEntry ?? ''}
            onChange={(e) => {
              const val = parseInt(e.target.value)
              if (val >= 1998 && val <= currentYear) {
                updateInlineRow(index, { yearOfEntry: val })
              }
            }}
            placeholder='Tahun'
            className='h-8 w-20 px-2 py-0 text-xs focus-visible:ring-1'
          />
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground hover:text-destructive h-8 w-8 p-0'
            onClick={() => removeInlineRow(index)}
          >
            <HugeiconsIcon icon={Close} className='size-4' />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

const getOrgColCount = (orgType?: string): number => {
  if (orgType === 'pp') return 3
  if (orgType === 'pw') return 2
  if (orgType === 'pd' || orgType === 'pdln') return 1
  return 0 // pk: no org picker, auto-assign
}

export const InlineQuickAddRow = ({
  organizations,
  parentOrgId,
  type,
  orgType
}: InlineQuickAddRowProps) => {
  const inlineMembers = useStore(inlineMembersStore)
  const currentYear = new Date().getFullYear()
  const orgColCount = getOrgColCount(orgType)
  const isPk = orgType === 'pk'
  const hasStatusCol = type !== 'pemandu' && type !== 'instruktur'
  const totalColCount = 8 + orgColCount + (hasStatusCol ? 0 : -1)

  const filteredOrganizations = React.useMemo(() => {
    if (isPk) return []
    const descendants = getDescendantIds(parentOrgId, organizations)
    return organizations.filter((org) => {
      const isCorrectType = org.type === 'pd' || org.type === 'pk'
      const isDescendant =
        descendants.includes(org.id) || org.id === parentOrgId
      return isCorrectType && isDescendant
    })
  }, [organizations, parentOrgId, isPk])

  const addRow = () => {
    const current = inlineMembersStore.get()
    inlineMembersStore.set([
      ...current,
      {
        _rowId: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: '',
        organizationId: isPk ? parentOrgId : '',
        status: 'ab1' as const,
        gender: 'ikhwan' as const,
        phone: '',
        yearOfEntry: currentYear,
        isAlumn: type === 'alumni',
        isCertifiedMentor: false,
        isCertifiedInstructor: false
      } as InlineRow
    ])
  }

  const addRowButton = (
    <TableRow className='hover:bg-transparent'>
      <TableCell colSpan={totalColCount} className='p-2'>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-full justify-center border-2 border-dashed text-xs'
          onClick={addRow}
        >
          <HugeiconsIcon icon={AddIcon} className='mr-2 size-3' />
          {inlineMembers.length === 0
            ? 'Tambah Data Kader'
            : 'Tambah Baris Lagi'}
        </Button>
      </TableCell>
    </TableRow>
  )

  return (
    <>
      {inlineMembers.map((member, index) => (
        <InlineRow
          key={member._rowId ?? index}
          member={member}
          index={index}
          filteredOrganizations={filteredOrganizations}
          currentYear={currentYear}
          orgColCount={orgColCount}
        />
      ))}
      {addRowButton}
    </>
  )
}
