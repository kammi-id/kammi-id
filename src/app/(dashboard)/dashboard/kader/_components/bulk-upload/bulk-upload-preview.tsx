'use client'

import { Input } from '~/components/shadcn/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { Badge } from '~/components/shadcn/ui/badge'
import { cn } from '~/lib/shadcn/utils'
import { BulkMemberRowSchema, type ParsedRow } from './bulk-upload-utils'

interface BulkUploadPreviewProps {
  rows: ParsedRow[]
  onChange: (rows: ParsedRow[]) => void
}

const revalidateRow = (row: ParsedRow): ParsedRow => {
  const result = BulkMemberRowSchema.safeParse(row.data)
  if (result.success) {
    return { ...row, data: result.data, errors: {}, valid: true }
  }
  const errors: Record<string, string> = {}
  for (const [field, msgs] of Object.entries(result.error.flatten().fieldErrors)) {
    errors[field] = (msgs as string[])[0]
  }
  return { ...row, errors, valid: false }
}

export const BulkUploadPreview = ({ rows, onChange }: BulkUploadPreviewProps) => {
  const updateRow = (index: number, field: string, value: unknown) => {
    const updated = rows.map((row) => {
      if (row.index !== index) return row
      const newData = { ...row.data, [field]: value }
      return revalidateRow({ ...row, data: newData })
    })
    onChange(updated)
  }

  const currentYear = new Date().getFullYear()
  const errorCount = rows.filter((r) => !r.valid).length

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <span className='text-muted-foreground text-sm'>{rows.length} baris ditemukan</span>
        {errorCount > 0 ? (
          <Badge variant='destructive'>{errorCount} baris error</Badge>
        ) : (
          <Badge className='bg-green-600 text-white'>Semua valid</Badge>
        )}
      </div>

      <div className='max-h-96 overflow-auto rounded-lg border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 sticky top-0'>
            <tr>
              <th className='px-3 py-2 text-left font-medium'>#</th>
              <th className='px-3 py-2 text-left font-medium'>Nama *</th>
              <th className='px-3 py-2 text-left font-medium'>Jenis Kelamin *</th>
              <th className='px-3 py-2 text-left font-medium'>Tahun Masuk *</th>
              <th className='px-3 py-2 text-left font-medium'>No HP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.index} className={cn('border-t', !row.valid && 'bg-destructive/5')}>
                <td className='text-muted-foreground px-3 py-2 text-xs'>{row.index + 1}</td>
                <td className='px-3 py-1.5'>
                  <Input
                    value={String(row.data.name ?? '')}
                    onChange={(e) => updateRow(row.index, 'name', e.target.value)}
                    className={cn('h-7 text-xs', row.errors.name && 'border-destructive')}
                  />
                  {row.errors.name && (
                    <p className='text-destructive mt-0.5 text-xs'>{row.errors.name}</p>
                  )}
                </td>
                <td className='px-3 py-1.5'>
                  <Select
                    value={String(row.data.gender ?? '')}
                    onValueChange={(v) => updateRow(row.index, 'gender', v)}
                  >
                    <SelectTrigger
                      className={cn('h-7 text-xs', row.errors.gender && 'border-destructive')}
                    >
                      <SelectValue placeholder='Pilih' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ikhwan'>Ikhwan</SelectItem>
                      <SelectItem value='akhwat'>Akhwat</SelectItem>
                    </SelectContent>
                  </Select>
                  {row.errors.gender && (
                    <p className='text-destructive mt-0.5 text-xs'>{row.errors.gender}</p>
                  )}
                </td>
                <td className='px-3 py-1.5'>
                  <Input
                    type='number'
                    min={1998}
                    max={currentYear}
                    value={String(row.data.yearOfEntry ?? '')}
                    onChange={(e) => updateRow(row.index, 'yearOfEntry', Number(e.target.value))}
                    className={cn(
                      'h-7 w-24 text-xs',
                      row.errors.yearOfEntry && 'border-destructive'
                    )}
                  />
                  {row.errors.yearOfEntry && (
                    <p className='text-destructive mt-0.5 text-xs'>{row.errors.yearOfEntry}</p>
                  )}
                </td>
                <td className='px-3 py-1.5'>
                  <Input
                    value={String(row.data.phone ?? '')}
                    onChange={(e) => updateRow(row.index, 'phone', e.target.value || null)}
                    className='h-7 text-xs'
                    placeholder='Opsional'
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
