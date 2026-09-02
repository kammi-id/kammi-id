'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import { SelfTransferIcon, Loading03Icon } from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/shadcn/ui/alert-dialog'
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxItem,
  ComboboxGroup,
  ComboboxList,
  ComboboxEmpty
} from '~/components/shadcn/ui/combobox'
import { mutateMemberAction } from './action'

interface MutateMemberButtonProps {
  memberId: string
  name: string
  currentOrganizationId: string
  currentOrganizationName: string
  organizations: { id: string; name: string }[]
}

export const MutateMemberButton = ({
  memberId,
  name,
  currentOrganizationId,
  currentOrganizationName,
  organizations
}: MutateMemberButtonProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [targetOrgId, setTargetOrgId] = useState<string | null>(null)

  const destinations = organizations.filter(
    (org) => org.id !== currentOrganizationId
  )
  const targetOrg = destinations.find((org) => org.id === targetOrgId)

  const handleConfirm = () => {
    if (!targetOrgId) return
    startTransition(async () => {
      const result = await mutateMemberAction(memberId, targetOrgId)
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <AlertDialog
      onOpenChange={(open) => {
        if (!open) setTargetOrgId(null)
      }}
    >
      <AlertDialogTrigger
        render={<Button variant='outline' size='sm' disabled={isPending} />}
      >
        {isPending ? (
          <HugeiconsIcon
            icon={Loading03Icon}
            className='mr-2 size-3.5 animate-spin'
          />
        ) : (
          <HugeiconsIcon icon={SelfTransferIcon} className='mr-2 size-3.5' />
        )}
        Mutasi Struktur
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mutasi {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Memindahkan Struktur dari{' '}
            <span className='font-medium'>{currentOrganizationName}</span> ke
            Struktur tujuan di bawah ini. NIA, Akun, dan riwayat Daurah tidak
            berubah.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='space-y-2'>
          <Combobox
            value={targetOrgId ?? undefined}
            onValueChange={(val) => setTargetOrgId(val ?? null)}
          >
            <ComboboxInput
              placeholder='Pilih Struktur tujuan'
              value={targetOrg?.name ?? ''}
            />
            <ComboboxContent>
              <ComboboxList>
                {destinations.length === 0 ? (
                  <ComboboxEmpty>Tidak ada Struktur tujuan.</ComboboxEmpty>
                ) : (
                  <ComboboxGroup>
                    {destinations.map((org) => (
                      <ComboboxItem key={org.id} value={org.id}>
                        {org.name}
                      </ComboboxItem>
                    ))}
                  </ComboboxGroup>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending || !targetOrgId}
          >
            Ya, Mutasi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
