'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { Upload01Icon, Download04Icon, Loading03Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/shadcn/ui/dialog'
import { appendCredentials, type CredentialEntry } from '~/components/credential-store/store'
import { generateTemplate, parseXLSXFile, type ParsedRow } from './bulk-upload-utils'
import { bulkCreateMembersAction } from './action'
import { BulkUploadPreview } from './bulk-upload-preview'

interface BulkUploadDialogProps {
  organizationId: string
  trainingId?: string
}

export const BulkUploadDialog = ({ organizationId, trainingId }: BulkUploadDialogProps) => {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [isPending, startTransition] = useTransition()

  const hasErrors = rows.some((r) => !r.valid)
  const canSubmit = rows.length > 0 && !hasErrors

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const parsed = await parseXLSXFile(file)
      setRows(parsed)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal membaca file')
    }
    e.target.value = ''
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    const members = rows.filter((r) => r.valid).map((r) => ({
      name: r.data.name!,
      gender: r.data.gender as 'ikhwan' | 'akhwat',
      yearOfEntry: r.data.yearOfEntry!,
      phone: r.data.phone ?? null
    }))

    startTransition(async () => {
      const result = await bulkCreateMembersAction({ members, organizationId, trainingId })
      if (result.success && result.data) {
        const entries: CredentialEntry[] = result.data.map((d) => ({
          memberId: d.memberId,
          name: d.name,
          registerNumber: d.registerNumber,
          password: d.password,
          organizationId,
          createdAt: new Date().toISOString()
        }))
        appendCredentials(organizationId, entries)
        toast.success(result.message)
        setOpen(false)
        setRows([])
      } else {
        toast.error(result.message ?? 'Terjadi kesalahan')
      }
    })
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) setRows([])
    setOpen(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant='outline' size='sm'>
            <HugeiconsIcon icon={Upload01Icon} className='mr-2 size-3.5' />
            Import XLSX
          </Button>
        }
      />
      <DialogContent className='max-w-4xl'>
        <DialogHeader>
          <DialogTitle>Import Kader dari XLSX</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='flex items-center gap-3'>
            <Button type='button' variant='outline' size='sm' onClick={generateTemplate}>
              <HugeiconsIcon icon={Download04Icon} className='mr-2 size-3.5' />
              Download Template
            </Button>
            <label
              htmlFor='xlsx-upload'
              className='bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-8 cursor-pointer items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors'
            >
              <HugeiconsIcon icon={Upload01Icon} className='size-3.5' />
              Pilih File XLSX
            </label>
            <input
              id='xlsx-upload'
              type='file'
              accept='.xlsx,.xls'
              className='sr-only'
              onChange={handleFileChange}
            />
          </div>

          {rows.length > 0 ? (
            <BulkUploadPreview rows={rows} onChange={setRows} />
          ) : (
            <p className='text-muted-foreground text-sm'>
              Upload file XLSX untuk memulai. Gunakan template agar format kolom sesuai.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isPending}>
            {isPending && (
              <HugeiconsIcon icon={Loading03Icon} className='mr-2 size-3.5 animate-spin' />
            )}
            {isPending ? 'Menyimpan...' : `Import ${rows.filter((r) => r.valid).length} Kader`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
