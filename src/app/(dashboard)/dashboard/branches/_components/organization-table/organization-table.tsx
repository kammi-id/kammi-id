'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/shadcn/ui/table'
import { Badge } from '~/components/shadcn/ui/badge'
import { HugeiconsIcon } from '@hugeicons/react'
import { Database01Icon } from '@hugeicons/core-free-icons'

interface Organization {
  id: string
  name: string
  type: string
  level: number
  parentId: string | null
}

interface OrganizationTableProps {
  data: Organization[]
}

/**
 * OrganizationTable component displays a summary list of organization units.
 *
 * It provides a high-level overview of organization names, their types,
 * and their hierarchical levels in a clean tabular format.
 *
 * @param props - The properties for the OrganizationTable component.
 * @param props.data - Array of organization data to be displayed.
 * @returns A React element rendering the organization summary table.
 */
export const OrganizationTable = ({ data }: OrganizationTableProps) => {
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Organisasi</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Level</TableHead>
            <TableHead className='text-right'>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? (
            data.map((org) => (
              <TableRow key={org.id}>
                <TableCell className='font-medium'>
                  <div className='flex items-center gap-2'>
                    <HugeiconsIcon
                      icon={Database01Icon}
                      strokeWidth={2}
                      className='text-muted-foreground size-4'
                    />
                    {org.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant='outline' className='capitalize'>
                    {org.type}
                  </Badge>
                </TableCell>
                <TableCell>Level {org.level}</TableCell>
                <TableCell className='text-right'>
                  <button className='text-primary text-sm hover:underline'>
                    Detail
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className='text-muted-foreground h-24 text-center'
              >
                Tidak ada data wilayah.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
