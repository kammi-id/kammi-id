'use client'

import * as React from 'react'
import { Organization } from './columns'
import { useStore } from '@nanostores/react'
import { orgSheetStore } from '../add-form/store'
import { BranchCard } from './branch-card'
import { BranchesHeader } from './branches-header'
import { BranchesPagination } from './branches-pagination'
import { BranchManagementSheet } from './branch-management-sheet'
import { EmptyState } from '~/components/shadcn/ui/empty-state'

interface BranchesGridProps {
  data: Organization[]
  basePath: string
  pageCount: number
  totalCount: number
  addButtonLabel: string
  userRole: string
  parentOrg: Organization
}

export const BranchesGrid = ({
  data,
  basePath,
  pageCount,
  totalCount,
  addButtonLabel,
  userRole,
  parentOrg
}: BranchesGridProps) => {
  const isOpen = useStore(orgSheetStore)
  const [editData, setEditData] = React.useState<Organization | null>(null)
  const canManage = userRole === 'bpw' || userRole === 'root'

  const handleEdit = (org: Organization | null) => {
    setEditData(org)
    orgSheetStore.set(true)
  }

  return (
    <>
      <div className='space-y-8'>
        <BranchesHeader
          totalCount={totalCount}
          dataCount={data.length}
          addButtonLabel={addButtonLabel}
          canManage={canManage}
          onAdd={() => handleEdit(null)}
        />

        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
          {data.length > 0 ? (
            data.map((org) => (
              <BranchCard
                key={org.id}
                org={org}
                basePath={basePath}
                onEdit={(org) => handleEdit(org)}
              />
            ))
          ) : (
            <div className='col-span-full'>
              <EmptyState
                title='Tidak ada wilayah ditemukan'
                description='Coba sesuaikan kata kunci pencarian atau filter Anda.'
              />
            </div>
          )}
        </div>

        <BranchesPagination pageCount={pageCount} />
      </div>

      <BranchManagementSheet
        isOpen={isOpen}
        onOpenChange={(open) => {
          orgSheetStore.set(open)
          if (!open) setEditData(null)
        }}
        editData={editData}
        addButtonLabel={addButtonLabel}
        parentOrg={parentOrg}
      />
    </>
  )
}
