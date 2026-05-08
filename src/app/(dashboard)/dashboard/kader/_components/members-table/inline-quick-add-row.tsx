'use client'

import * as React from 'react'
import { TableRow, TableCell } from '~/components/shadcn/ui/table'
import { useStore } from '@nanostores/react'
import {
  inlineMembersStore,
  updateInlineRow,
  removeInlineRow
} from '../add-form/store'
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

interface InlineQuickAddRowProps {
  organizations: {
    id: string
    name: string
    type: string
    parentId?: string | null
  }[]
  parentOrgId: string
  type?: string
}

// Helper to find all descendant organization IDs
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

export const InlineQuickAddRow = ({
  organizations,
  parentOrgId,
  type
}: InlineQuickAddRowProps) => {
  const inlineMembers = useStore(inlineMembersStore)
  const currentYear = new Date().getFullYear()

  // Filter organizations to only show 'pd' and 'pk' that are descendants of the parentOrgId
  const filteredOrganizations = React.useMemo(() => {
    const descendants = getDescendantIds(parentOrgId, organizations)

    return organizations.filter((org) => {
      const isCorrectType = org.type === 'pd' || org.type === 'pk'
      const isDescendant =
        descendants.includes(org.id) || org.id === parentOrgId
      return isCorrectType && isDescendant
    })
  }, [organizations, parentOrgId])

  if (inlineMembers.length === 0) {
    return (
      <TableRow className='hover:bg-transparent'>
        <TableCell colSpan={7} className='p-2'>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 w-full justify-center border-2 border-dashed text-xs'
            onClick={() => {
              const current = inlineMembersStore.get()
              inlineMembersStore.set([
                ...current,
                {
                  name: '',
                  organizationId: '',
                  status: 'ab1',
                  gender: 'ikhwan',
                  phone: '',
                  yearOfEntry: currentYear.toString(),
                  isAlumn: type === 'alumni'
                }
              ])
            }}
          >
            <HugeiconsIcon icon={AddIcon} className='mr-2 size-3' />
            Tambah Data Kader
          </Button>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {inlineMembers.map((member, index) => (
        <TableRow
          key={index}
          className='bg-primary/5 hover:bg-primary/10 group transition-colors'
        >
          <TableCell className='p-2'>
            <div className='text-muted-foreground text-center text-xs italic'>
              Auto
            </div>
          </TableCell>
          <TableCell className='p-2'>
            <Input
              value={member.name}
              placeholder='Nama'
              className='h-8 px-2 py-0 text-xs focus-visible:ring-1'
              onChange={(e) => updateInlineRow(index, { name: e.target.value })}
            />
          </TableCell>
          <TableCell className='p-2'>
            <Combobox
              value={member.organizationId}
              onValueChange={(val) =>
                updateInlineRow(index, { organizationId: val })
              }
            >
              <ComboboxInput
                placeholder='Pilih PW/PD/PDLN/PK'
                value={
                  organizations.find((org) => org.id === member.organizationId)
                    ?.name ?? ''
                }
                onChange={() => {}} // Managed by combobox
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
          </TableCell>
          <TableCell className='p-2'>
            <Select
              value={member.status}
              onValueChange={(val) => updateInlineRow(index, { status: val })}
            >
              <SelectTrigger className='h-8 text-xs'>
                <SelectValue placeholder='Status'>
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
              value={member.gender}
              onValueChange={(val) => updateInlineRow(index, { gender: val })}
            >
              <SelectTrigger className='h-8 text-xs'>
                <SelectValue placeholder='Gender'>
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
            <Input
              value={member.phone}
              onChange={(e) =>
                updateInlineRow(index, { phone: e.target.value })
              }
              placeholder='No. HP'
              className='h-8 px-2 py-0 text-xs focus-visible:ring-1'
            />
          </TableCell>
          <TableCell className='p-2'>
            <div className='flex items-center gap-2'>
              <Input
                type='number'
                value={member.yearOfEntry}
                onChange={(e) => {
                  const val = e.target.value
                  if (parseInt(val) >= 1998 && parseInt(val) <= currentYear) {
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
      ))}
      <TableRow className='hover:bg-transparent'>
        <TableCell colSpan={7} className='p-2'>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 w-full justify-center border-2 border-dashed text-xs'
            onClick={() => {
              const current = inlineMembersStore.get()
              inlineMembersStore.set([
                ...current,
                {
                  name: '',
                  organizationId: '',
                  status: 'ab1',
                  gender: 'ikhwan',
                  phone: '',
                  yearOfEntry: currentYear.toString(),
                  isAlumn: type === 'alumni'
                }
              ])
            }}
          >
            <HugeiconsIcon icon={AddIcon} className='mr-2 size-3' />
            Tambah Baris Lagi
          </Button>
        </TableCell>
      </TableRow>
    </>
  )
}
