'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  MoreVerticalCircle01Icon,
  Delete02Icon,
  Loading03Icon
} from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Label } from '~/components/shadcn/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/shadcn/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '~/components/shadcn/ui/alert-dialog'
import { deleteArticleAction } from './action'

interface DeleteArticleButtonProps {
  articleId: string
  title: string
}

export const DeleteArticleButton = ({
  articleId,
  title
}: DeleteArticleButtonProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [alertOpen, setAlertOpen] = useState(false)
  const [confirmValue, setConfirmValue] = useState('')

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteArticleAction(articleId, confirmValue)
      if (result.success) {
        toast.success(result.message)
        router.push('/dashboard/articles')
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Menu artikel'
              disabled={isPending}
            />
          }
        >
          {isPending ? (
            <HugeiconsIcon
              icon={Loading03Icon}
              className='size-4 animate-spin'
            />
          ) : (
            <HugeiconsIcon icon={MoreVerticalCircle01Icon} className='size-4' />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem
            variant='destructive'
            onClick={() => setAlertOpen(true)}
          >
            <HugeiconsIcon icon={Delete02Icon} />
            Hapus Artikel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={alertOpen}
        onOpenChange={(open) => {
          setAlertOpen(open)
          if (!open) setConfirmValue('')
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {title}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus artikel ini secara permanen dan tidak
              dapat dibatalkan. Untuk melanjutkan, ketik judul artikel{' '}
              <span className='font-geist-mono font-medium'>{title}</span> di
              bawah ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='confirm-article-title'>Judul Artikel</Label>
            <Input
              id='confirm-article-title'
              value={confirmValue}
              onChange={(e) => setConfirmValue(e.target.value)}
              placeholder={title}
              autoComplete='off'
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={handleConfirm}
              disabled={isPending || confirmValue !== title}
            >
              Ya, Hapus Artikel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
