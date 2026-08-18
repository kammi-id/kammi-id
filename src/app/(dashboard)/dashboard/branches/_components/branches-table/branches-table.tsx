'use client'

import * as React from 'react'
import { DataTable } from '../../../_components/data-table'
import { getColumns, type Organization, type StrukturRow } from './columns'
import { Button } from '~/components/shadcn/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon } from '@hugeicons/core-free-icons'
import { BranchManagementSheet } from '../branch-management-sheet'
import { useStore } from '@nanostores/react'
import { orgSheetStore } from '../add-form/store'

interface BranchesTableProps {
  data: StrukturRow[]
  nameHeader: string
  addButtonLabel: string
  pageCount: number
  totalCount: number
  parentOrg: Organization
  /** The `buat` cell, decided on the server. Never derived from `role` here. */
  canAdd: boolean
  basePath: string
}

/**
 * The table view of the same rows the grid shows — and deliberately the same
 * component behind the Kelola button. Grid and table must not grow two
 * different rules about who may do what (spec §8).
 *
 * @param props - The properties for the BranchesTable component.
 * @param props.data - Array of organization rows, each carrying its server-computed flags.
 * @param props.nameHeader - The title used for the table header and column definitions.
 * @param props.addButtonLabel - Label for the "Add" button (e.g., 'Wilayah').
 * @param props.pageCount - Total number of pages from the server.
 * @param props.totalCount - Total number of items in the dataset.
 * @param props.parentOrg - The parent organization context for the current view.
 * @param props.canAdd - Whether the caller holds `buat` beneath `parentOrg`.
 * @param props.basePath - The base URL path for navigation/linking.
 * @returns A React element rendering the branch management table and its sheet.
 */
export const BranchesTable = ({
  data,
  nameHeader,
  addButtonLabel,
  pageCount,
  totalCount,
  parentOrg,
  canAdd,
  basePath
}: BranchesTableProps) => {
  const isOpen = useStore(orgSheetStore)
  const [editData, setEditData] = React.useState<StrukturRow | null>(null)
  const columns = getColumns(nameHeader, basePath, (org) => {
    setEditData(org)
    orgSheetStore.set(true)
  })

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchKey='name'
        pageCount={pageCount}
        totalCount={totalCount}
        actionElement={
          canAdd && (
            <Button
              size='sm'
              className='h-8 gap-2'
              onClick={() => {
                setEditData(null)
                orgSheetStore.set(true)
              }}
            >
              <HugeiconsIcon
                icon={Add01Icon}
                strokeWidth={2}
                className='size-4'
              />
              Tambah {addButtonLabel}
            </Button>
          )
        }
      />
      <BranchManagementSheet
        isOpen={isOpen}
        onOpenChange={(open) => {
          orgSheetStore.set(open)
          if (!open) setEditData(null)
        }}
        editData={editData}
        addButtonLabel={addButtonLabel}
        parentOrg={parentOrg}
        basePath={basePath}
      />
    </>
  )
}
