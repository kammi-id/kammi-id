'use client'

import { useStore } from '@nanostores/react'
import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Key01Icon, Download04Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Badge } from '~/components/shadcn/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/components/shadcn/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/shadcn/ui/alert-dialog'
import { credentialStore, clearCredentials, type CredentialEntry } from './store'

type CredentialPanelProps = {
  organizationId: string
  orgSlug: string
}

const downloadCSV = (entries: CredentialEntry[], orgSlug: string) => {
  const today = new Date().toISOString().slice(0, 10)
  const filename = `credentials-${orgSlug}-${today}.csv`

  const header = 'Nama,NIK (Username),Password,Tanggal Generate'
  const rows = entries.map(
    (e) =>
      `"${e.name}","${e.registerNumber}","${e.password}","${e.createdAt}"`
  )
  const csv = [header, ...rows].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const CredentialPanel = ({ organizationId, orgSlug }: CredentialPanelProps) => {
  const store = useStore(credentialStore)
  const [open, setOpen] = useState(false)

  const entries = store[organizationId] ?? []
  const count = entries.length

  const handleClear = () => {
    clearCredentials(organizationId)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="relative" aria-label="Lihat credential tersimpan" />
        }
      >
        <HugeiconsIcon icon={Key01Icon} strokeWidth={2} />
        {count > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none"
            variant="default"
          >
            {count > 99 ? '99+' : count}
          </Badge>
        )}
      </SheetTrigger>

      <SheetContent side="right" className="sm:max-w-lg w-full flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Credential Tersimpan</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {count > 0
              ? `${count} credential tersimpan untuk organisasi ini`
              : 'Belum ada credential tersimpan'}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-auto">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center text-muted-foreground">
              <HugeiconsIcon icon={Key01Icon} strokeWidth={1.5} className="size-10 opacity-40" />
              <p className="text-sm">
                Belum ada credential yang di-generate. Upload XLSX kader untuk mulai generate.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nama</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">NIK</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Password</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Tgl. Generate</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.registerNumber} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 max-w-[160px] truncate font-medium">{entry.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{entry.registerNumber}</td>
                      <td className="px-4 py-3 font-mono text-xs">{entry.password}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {count > 0 && (
          <div className="flex items-center justify-between gap-3 border-t px-6 py-4">
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" />
                }
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                Hapus Semua
              </AlertDialogTrigger>
              <AlertDialogContent size="sm">
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus semua credential?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Semua {count} credential yang tersimpan untuk organisasi ini akan dihapus.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleClear}
                  >
                    Hapus Semua
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              size="sm"
              onClick={() => downloadCSV(entries, orgSlug)}
            >
              <HugeiconsIcon icon={Download04Icon} strokeWidth={2} />
              Download CSV
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
