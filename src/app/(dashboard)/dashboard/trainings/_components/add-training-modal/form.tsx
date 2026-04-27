'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '~/components/shadcn/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '~/components/shadcn/ui/form'
import { Input } from '~/components/shadcn/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/shadcn/ui/select'
import { createTrainingAction } from '~/lib/actions/training'
import { TrainingFormValues } from './types'
import { toast } from 'sonner'
import { useTransition } from 'react'

const formSchema = z.object({
  organizationId: z.string().min(1, 'Organisasi wajib dipilih'),
  name: z.string().min(1, 'Nama pelatihan wajib diisi'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
  registrationDeadline: z.string().optional(),
  type: z.enum(['dm1', 'dm2', 'dpmk', 'tfi', 'dm3', 'other']),
})

interface TrainingFormProps {
  organizations: { id: string; name: string }[]
  onSuccess: () => void
}

export const TrainingForm = ({ organizations, onSuccess }: TrainingFormProps) => {
  const [isPending, startTransition] = useTransition()

  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      type: 'dm1',
    },
  })

  const onSubmit = async (values: TrainingFormValues) => {
    startTransition(async () => {
      const response = await createTrainingAction(values)
      if (response.success) {
        toast.success(response.message)
        onSuccess()
      } else {
        toast.error(response.message)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='organizationId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organisasi</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Pilih Organisasi' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Pelatihan</FormLabel>
              <FormControl>
                <Input placeholder='Contoh: DM 1 Nasional' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='startDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Mulai</FormLabel>
                <FormControl>
                  <Input type='date' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='endDate'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Selesai</FormLabel>
                <FormControl>
                  <Input type='date' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name='registrationDeadline'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deadline Pendaftaran (Opsional)</FormLabel>
              <FormControl>
                <Input type='date' {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='type'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Pelatihan</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='Pilih Tipe' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value='dm1'>DM 1</SelectItem>
                  <SelectItem value='dm2'>DM 2</SelectItem>
                  <SelectItem value='dpmk'>DPMK</SelectItem>
                  <SelectItem value='tfi'>TFI</SelectItem>
                  <SelectItem value='dm3'>DM 3</SelectItem>
                  <SelectItem value='other'>Lainnya</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex justify-end gap-2 pt-4'>
          <Button type='submit' disabled={isPending}>
            {isPending ? 'Menyimpan...' : 'Simpan Pelatihan'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
