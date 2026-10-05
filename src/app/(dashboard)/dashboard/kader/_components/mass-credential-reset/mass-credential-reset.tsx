'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Key01Icon,
  Loading03Icon,
  ViewIcon,
  ViewOffIcon
} from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/shadcn/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '~/components/shadcn/ui/input-group'
import { Input } from '~/components/shadcn/ui/input'
import { Skeleton } from '~/components/shadcn/ui/skeleton'
import {
  readMassCredentialResetPreviewAction,
  regenerateMassCredentialsAction,
  type MassCredentialResetPreview
} from './action'
import { downloadMassCredentialCsv } from './utils'

interface MassCredentialResetProps {
  organizationId: string
}

/**
 * Tiket 06 — regenerasi kredensial massal. Tidak memakai
 * `src/components/credential-store` (panel satu-sesi untuk beberapa baris):
 * keluarannya adalah berkas CSV yang diunduh, bukan panel yang dibuka lagi
 * nanti, dan barisnya bisa mencapai ribuan.
 *
 * Ketiga lapis konfirmasi tampil sekaligus dalam satu dialog, berurutan dari
 * atas ke bawah — bukan sebagai wizard tiga layar — dan tombol kirimnya baru
 * menyala setelah ketiganya terpenuhi: jumlah sudah terbaca, kode Struktur
 * yang diketik cocok, dan password terisi. Server tetap mengadili ketiganya
 * ulang; ini hanya mencegah klik yang jelas akan ditolak.
 */
export const MassCredentialReset = ({
  organizationId
}: MassCredentialResetProps) => {
  const [open, setOpen] = React.useState(false)
  const [preview, setPreview] =
    React.useState<MassCredentialResetPreview | null>(null)
  const [confirmCode, setConfirmCode] = React.useState('')
  const [actorPassword, setActorPassword] = React.useState('')
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (!open) {
      setPreview(null)
      setConfirmCode('')
      setActorPassword('')
      setIsPasswordVisible(false)
      setError(null)
      return
    }
    let cancelled = false
    readMassCredentialResetPreviewAction(organizationId).then((result) => {
      if (!cancelled) setPreview(result)
    })
    return () => {
      cancelled = true
    }
  }, [open, organizationId])

  const canSubmit =
    !!preview &&
    preview.count > 0 &&
    confirmCode.trim() === preview.organizationCode &&
    actorPassword.length > 0 &&
    !isPending

  const submit = () => {
    if (!preview) return
    setError(null)

    startTransition(async () => {
      const result = await regenerateMassCredentialsAction({
        organizationId,
        confirmCode,
        actorPassword
      })

      if (!result.success || !result.rows) {
        setError(result.message)
        setActorPassword('')
        return
      }

      downloadMassCredentialCsv(result.rows, preview.organizationCode)
      toast.success(result.message)
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant='outline' size='sm'>
            <HugeiconsIcon
              icon={Key01Icon}
              strokeWidth={2}
              data-icon='inline-start'
            />
            Regenerasi Kredensial Massal
          </Button>
        }
      />

      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Regenerasi Kredensial Massal</DialogTitle>
          <DialogDescription>
            Menerbitkan ulang password setiap Akun Kader di Struktur ini dan
            seluruh turunannya. Password lama hilang begitu ini berjalan — tidak
            ada jalan mundur.
          </DialogDescription>
        </DialogHeader>

        {!preview ? (
          <div className='space-y-2'>
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-4 w-1/2' />
          </div>
        ) : preview.count === 0 ? (
          <p className='text-muted-foreground text-sm'>
            {preview.organizationName} tidak punya Akun Kader untuk
            diregenerasi.
          </p>
        ) : (
          <FieldGroup>
            <div className='bg-muted/60 rounded-md p-3'>
              <p className='text-foreground text-sm'>
                Tindakan ini akan mereset password{' '}
                <strong>{preview.count} Kader</strong> di{' '}
                {preview.organizationName} dan mengeluarkan mereka dari seluruh
                sesi yang sedang berjalan.
              </p>
            </div>

            <Field>
              <FieldLabel htmlFor='mass-credential-reset-code'>
                Ketik kode struktur{' '}
                <span className='font-geist-mono text-foreground font-medium'>
                  {preview.organizationCode}
                </span>{' '}
                untuk melanjutkan
              </FieldLabel>
              <Input
                id='mass-credential-reset-code'
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder={preview.organizationCode}
                autoComplete='off'
              />
            </Field>

            <Field>
              <FieldLabel htmlFor='mass-credential-reset-password'>
                Password Antum saat ini
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id='mass-credential-reset-password'
                  type={isPasswordVisible ? 'text' : 'password'}
                  autoComplete='current-password'
                  value={actorPassword}
                  onChange={(e) => setActorPassword(e.target.value)}
                />
                <InputGroupAddon align='inline-end'>
                  <InputGroupButton
                    type='button'
                    size='icon-xs'
                    onClick={() => setIsPasswordVisible((v) => !v)}
                    aria-label={
                      isPasswordVisible
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }
                  >
                    <HugeiconsIcon
                      icon={isPasswordVisible ? ViewOffIcon : ViewIcon}
                      strokeWidth={2}
                    />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              <FieldDescription>
                Dipakai untuk memverifikasi bahwa Antum yang sungguh menekan
                tombol ini.
              </FieldDescription>
            </Field>

            {error && (
              <p className='text-destructive text-sm' role='alert'>
                {error}
              </p>
            )}
          </FieldGroup>
        )}

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpen(false)}
          >
            Batal
          </Button>
          {preview && preview.count > 0 && (
            <Button
              type='button'
              variant='destructive'
              disabled={!canSubmit}
              onClick={submit}
            >
              {isPending && (
                <HugeiconsIcon
                  icon={Loading03Icon}
                  strokeWidth={2}
                  className='animate-spin'
                  data-icon='inline-start'
                />
              )}
              Regenerasi dan Unduh CSV
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
