'use client'

import * as React from 'react'
import { useOptimistic } from 'react'
import { DataTable } from '../../../_components/data-table'
import { type IndividualMember } from './types'
import { getColumns } from './columns'
import { useStore } from '@nanostores/react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  inlineMembersStore,
  clearInlineRows,
  isSavingStore,
  type InlineRow
} from '~/app/(dashboard)/dashboard/kader/_components/add-form/store'
import { Button } from '~/components/shadcn/ui/button'
import { InlineQuickAddRow } from '../members-table/inline-quick-add-row'
import { HugeiconsIcon } from '@hugeicons/react'
import { CopyCheckIcon, Cancel01Icon } from '@hugeicons/core-free-icons'
import { Spinner } from '~/components/shadcn/ui/spinner'
import { createMemberAction, type MemberFormState } from '~/app/(dashboard)/dashboard/kader/_components/add-form/action'
import { toast } from 'sonner'

interface IndividualMemberTableProps {
  data: IndividualMember[]
  pageCount: number
  totalCount: number
  userRole: string
  parentOrgId: string
  type?: string
  orgType?: string
  organizations: { id: string; name: string; type: string }[]
}

export const IndividualMemberTable = ({
  data,
  pageCount,
  totalCount,
  userRole,
  parentOrgId,
  type,
  orgType,
  organizations
}: IndividualMemberTableProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const inlineMembers = useStore(inlineMembersStore)
  const isSaving = useStore(isSavingStore)
  const canManage = userRole === 'root' || userRole === 'bpk'

  const [optimisticData, addOptimisticMember] = useOptimistic(
    data,
    (state, newMembers: InlineRow[]) => [
      ...state,
      ...newMembers.map(
        (m) =>
          ({
            ...m,
            id: `temp-${Math.random().toString(36).substring(2, 11)}`,
            registerNumber: '...',
            organization: {
              name: 'Saving...'
            } as unknown as IndividualMember['organization']
          }) as IndividualMember
      )
    ]
  )

  const handleSave = React.useCallback(async () => {
    if (inlineMembers.length === 0 || isSaving) return

    const membersToSave = [...inlineMembers]

    const invalid = membersToSave.filter(
      (m) => !m.name?.trim() || !m.organizationId
    )
    if (invalid.length > 0) {
      toast.error(
        `${invalid.length} baris belum lengkap. Isi nama dan PD/PK sebelum menyimpan.`
      )
      return
    }

    isSavingStore.set(true)
    React.startTransition(() => {
      addOptimisticMember(membersToSave)
    })

    try {
      const results = await Promise.all(
        membersToSave.map(async (member) => {
          const formData = new FormData()
          Object.entries(member).forEach(([key, value]) => {
            if (value !== undefined && value !== null && !key.startsWith('_')) {
              formData.append(key, value.toString())
            }
          })
          return createMemberAction(
            { success: false } as MemberFormState,
            formData
          )
        })
      )

      const failedIndices = results
        .map((r, i) => (!r.success ? i : -1))
        .filter((i) => i !== -1)

      if (failedIndices.length > 0) {
        const failedRows = failedIndices.map((i) => membersToSave[i])
        inlineMembersStore.set(failedRows)
        toast.error(
          `${failedIndices.length} dari ${membersToSave.length} data gagal disimpan. Periksa kembali baris yang ditandai.`
        )
      } else {
        clearInlineRows()
        toast.success(`${membersToSave.length} data kader berhasil disimpan.`)
      }
    } catch (error) {
      inlineMembersStore.set(membersToSave)
      toast.error('Terjadi kesalahan saat menyimpan data. Coba lagi.')
      console.error(error)
    } finally {
      isSavingStore.set(false)
    }
  }, [inlineMembers, isSaving, addOptimisticMember])

  const handleFilterChange = React.useCallback(
    (filterType: 'status' | 'gender', value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (filterType === 'status') {
        const currentStatus = params.get('status')
        if (currentStatus === value) {
          params.delete('status')
        } else {
          params.set('status', value)
        }
      } else if (filterType === 'gender') {
        const currentGender = params.get('gender')
        if (currentGender === value) {
          params.delete('gender')
        } else {
          params.set('gender', value)
        }
      }
      params.set('page', '1')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  const handleSortChange = React.useCallback(
    (columnId: string) => {
      const params = new URLSearchParams(searchParams.toString())
      const currentSort = params.get('sort')
      const currentOrder = params.get('order')

      let newOrder = 'desc'
      if (currentSort === columnId) {
        newOrder = currentOrder === 'desc' ? 'asc' : 'desc'
      }

      params.set('sort', columnId)
      params.set('order', newOrder)
      params.set('page', '1')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <>
      <DataTable
        columns={getColumns(
          type,
          orgType,
          handleFilterChange,
          handleSortChange
        )}
        data={optimisticData}
        searchKey='name'
        placeholder={
          type === 'alumni'
            ? 'Cari nama alumni...'
            : type === 'pemandu'
              ? 'Cari nama pemandu...'
              : type === 'instruktur'
                ? 'Cari nama instruktur...'
                : 'Cari nama kader...'
        }
        pageCount={pageCount}
        totalCount={totalCount}
        queryPrefix='m'
        filterKeys={['status', 'gender']}
        footerRows={
          canManage &&
          type !== 'pemandu' &&
          type !== 'instruktur' &&
          !isSaving ? (
            <InlineQuickAddRow
              organizations={organizations}
              parentOrgId={parentOrgId}
              type={type}
            />
          ) : null
        }
        actionElement={
          canManage &&
          type !== 'pemandu' &&
          type !== 'instruktur' &&
          inlineMembers.length > 0 && (
            <div className='flex items-center gap-2'>
              <Button
                size='sm'
                variant='outline'
                className='h-8 gap-2'
                onClick={clearInlineRows}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  className='size-4'
                />
                Batal
              </Button>
              <Button
                size='sm'
                className='h-8 gap-2'
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? (
                  <>
                    <Spinner className='size-3' />
                    Menyimpan data...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={CopyCheckIcon}
                      strokeWidth={2}
                      className='size-4'
                    />
                    Simpan Data Kader
                  </>
                )}
              </Button>
            </div>
          )
        }
      />
    </>
  )
}
