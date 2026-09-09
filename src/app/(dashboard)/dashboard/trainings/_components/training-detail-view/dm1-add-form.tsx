'use client'

import * as React from 'react'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Label } from '~/components/shadcn/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon, UserAdd01Icon } from '@hugeicons/core-free-icons'
import { addDM1AttendantAction } from './action'

interface DM1AddFormProps {
  trainingId: string
  organizationId: string
  onSuccess?: () => void
}

export const DM1AddForm = ({
  trainingId,
  organizationId,
  onSuccess
}: DM1AddFormProps) => {
  const [state, action, isPending] = useActionState(addDM1AttendantAction, {
    success: false,
    message: ''
  })

  const [gender, setGender] = React.useState<'ikhwan' | 'akhwat'>('ikhwan')
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      onSuccess?.()
    } else if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, onSuccess])

  return (
    <form action={action} className='space-y-4'>
      <input type='hidden' name='trainingId' value={trainingId} />
      <input type='hidden' name='organizationId' value={organizationId} />
      <input type='hidden' name='gender' value={gender} />
      <input type='hidden' name='status' value='ab1' />

      <div className='grid gap-4 sm:grid-cols-2'>
        <div className='space-y-1.5 sm:col-span-2'>
          <Label htmlFor='dm1-name' className='text-xs'>
            Nama Lengkap <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='dm1-name'
            name='name'
            placeholder='Nama lengkap kader baru'
            required
            className='h-8 text-sm'
          />
          {state.errors?.name && (
            <p className='text-destructive text-xs'>{state.errors.name[0]}</p>
          )}
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='dm1-gender' className='text-xs'>
            Jenis Kelamin <span className='text-destructive'>*</span>
          </Label>
          <Select
            value={gender}
            onValueChange={(v) => v && setGender(v as 'ikhwan' | 'akhwat')}
          >
            <SelectTrigger id='dm1-gender' size='sm' className='h-8 text-sm'>
              <SelectValue>
                {gender === 'ikhwan' ? 'Ikhwan' : 'Akhwat'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ikhwan'>Ikhwan</SelectItem>
              <SelectItem value='akhwat'>Akhwat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-1.5'>
          <Label htmlFor='dm1-year' className='text-xs'>
            Tahun Masuk KAMMI <span className='text-destructive'>*</span>
          </Label>
          <Input
            id='dm1-year'
            name='yearOfEntry'
            type='number'
            min={1998}
            max={currentYear}
            defaultValue={currentYear}
            required
            className='h-8 text-sm'
          />
          {state.errors?.yearOfEntry && (
            <p className='text-destructive text-xs'>
              {state.errors.yearOfEntry[0]}
            </p>
          )}
        </div>

        <div className='space-y-1.5 sm:col-span-2'>
          <Label htmlFor='dm1-phone' className='text-xs'>
            Nomor HP
          </Label>
          <Input
            id='dm1-phone'
            name='phone'
            type='tel'
            placeholder='08xxxxxxxx (opsional)'
            className='h-8 text-sm'
          />
        </div>
      </div>

      <p className='text-muted-foreground text-xs'>
        Nomor registrasi akan dibuat otomatis. Status kader baru: AB1.
      </p>

      <Button type='submit' size='sm' disabled={isPending} className='w-full'>
        {isPending ? (
          <HugeiconsIcon
            icon={Loading03Icon}
            className='mr-2 size-3.5 animate-spin'
          />
        ) : (
          <HugeiconsIcon icon={UserAdd01Icon} className='mr-2 size-3.5' />
        )}
        {isPending ? 'Menyimpan...' : 'Daftarkan sebagai Peserta DM1'}
      </Button>
    </form>
  )
}
