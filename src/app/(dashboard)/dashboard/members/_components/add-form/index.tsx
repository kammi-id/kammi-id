'use client'

import * as React from 'react'
import { useActionState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '~/components/shadcn/ui/select'
import MOCK_ADDRESS_DATA from './_mock-address'
import { createMemberAction, updateMemberAction, type MemberFormState } from './action'
import { memberSheetStore, memberEditData, closeMemberSheet } from './store'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon } from '@hugeicons/core-free-icons'

export const AddMemberForm = ({ organizationId }: { organizationId: string }) => {
  const currentYear = new Date().getFullYear();
  const editData = useStore(memberEditData)

  const [province, setProvince] = React.useState(editData?.addressProvinceCode || '')
  const [city, setCity] = React.useState(editData?.addressCityCode || '')
  const [district, setDistrict] = React.useState(editData?.addressDistrictCode || '')
  const [subdistrict, setSubdistrict] = React.useState(editData?.addressSubdistrictCode || '')

  useEffect(() => {
    if (editData) {
      setProvince(editData.addressProvinceCode || '')
      setCity(editData.addressCityCode || '')
      setDistrict(editData.addressDistrictCode || '')
      setSubdistrict(editData.addressSubdistrictCode || '')
    }
  }, [editData])

  const [state, action, isPending] = useActionState(
    async (prevState: MemberFormState, formData: FormData) => {
      if (editData) {
        return updateMemberAction(prevState, formData)
      }
      return createMemberAction(prevState, formData)
    },
    { success: false } as MemberFormState
  )

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      closeMemberSheet()
    } else if (state.message) {
      toast.error(state.message)
    }
  }, [state])

  return (
    <form action={action} className='space-y-6 p-6'>
      <input type='hidden' name='organizationId' value={organizationId} />
      {editData && <input type='hidden' name='id' value={editData.id} />}

      <FieldGroup>
        <div className='text-sm font-medium mb-4'>Data Diri</div>
        <Field>
          <FieldLabel htmlFor='name'>Nama Lengkap</FieldLabel>
          <Input
            id='name'
            name='name'
            placeholder='Masukkan nama lengkap'
            defaultValue={editData?.name}
            required
          />
          <FieldError errors={state.errors?.name?.map(m => ({ message: m }))} />
        </Field>

        <div className='grid grid-cols-2 gap-4'>
          <Field>
            <FieldLabel htmlFor='gender'>Gender</FieldLabel>
            <Select name='gender' defaultValue={editData?.gender ?? 'ikhwan'}>
              <SelectTrigger>
                <SelectValue placeholder='Pilih gender' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ikhwan'>Ikhwan</SelectItem>
                <SelectItem value='akhwat'>Akhwat</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor='status'>Status</FieldLabel>
            <Select name='status' defaultValue={editData?.status ?? 'ab1'}>
              <SelectTrigger>
                <SelectValue placeholder='Pilih status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ab1'>AB1</SelectItem>
                <SelectItem value='ab2'>AB2</SelectItem>
                <SelectItem value='ab3'>AB3</SelectItem>
              </SelectContent>
            </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor='phone'>No. HP / WhatsApp</FieldLabel>
            <Input
              id='phone'
              name='phone'
              placeholder='Contoh: 08123456789'
              defaultValue={editData?.phone ?? ''}
            />
            <FieldError errors={state.errors?.phone?.map(m => ({ message: m }))} />
          </Field>

          <Field>
            <FieldLabel htmlFor='yearOfEntry'>Tahun Masuk</FieldLabel>
            <Input
              id='yearOfEntry'
              name='yearOfEntry'
              type='number'
              min='1998'
              max={currentYear}
              defaultValue={editData?.yearOfEntry ?? currentYear}
              required
            />
            <FieldError errors={state.errors?.yearOfEntry?.map(m => ({ message: m }))} />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <div className='text-sm font-medium mb-4'>Alamat</div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Field>
              <FieldLabel htmlFor='addressProvince'>Provinsi</FieldLabel>
              <Select
                name='addressProvince'
                value={province}
                onValueChange={(val) => {
                  setProvince(val)
                  setCity('')
                  setDistrict('')
                  setSubdistrict('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Provinsi' />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_ADDRESS_DATA.provinces.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type='hidden' name='addressProvinceCode' value={province} />
            </Field>

            <Field>
              <FieldLabel htmlFor='addressCity'>Kota/Kabupaten</FieldLabel>
              <Select
                name='addressCity'
                value={city}
                disabled={!province}
                onValueChange={(val) => {
                  setCity(val)
                  setDistrict('')
                  setSubdistrict('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Kota/Kabupaten' />
                </SelectTrigger>
                <SelectContent>
                  {(MOCK_ADDRESS_DATA.cities[province as keyof typeof MOCK_ADDRESS_DATA.cities] || []).map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type='hidden' name='addressCityCode' value={city} />
            </Field>

            <Field>
              <FieldLabel htmlFor='addressDistrict'>Kecamatan</FieldLabel>
              <Select
                name='addressDistrict'
                value={district}
                disabled={!city}
                onValueChange={(val) => {
                  setDistrict(val)
                  setSubdistrict('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Kecamatan' />
                </SelectTrigger>
                <SelectContent>
                  {(MOCK_ADDRESS_DATA.districts[city as keyof typeof MOCK_ADDRESS_DATA.districts] || []).map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type='hidden' name='addressDistrictCode' value={district} />
            </Field>

            <Field>
              <FieldLabel htmlFor='addressSubdistrict'>Kelurahan/Desa</FieldLabel>
              <Select
                name='addressSubdistrict'
                value={subdistrict}
                disabled={!district}
                onValueChange={(val) => {
                  setSubdistrict(val)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Pilih Kelurahan/Desa' />
                </SelectTrigger>
                <SelectContent>
                  {(MOCK_ADDRESS_DATA.subdistricts[district as keyof typeof MOCK_ADDRESS_DATA.subdistricts] || []).map((s) => (
                    <SelectItem key={s.code} value={s.code}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type='hidden' name='addressSubdistrictCode' value={subdistrict} />
            </Field>
          </div>
          <Field className='mt-4'>
            <FieldLabel htmlFor='addressLine'>Alamat Lengkap</FieldLabel>
            <Input
              id='addressLine'
              name='addressLine'
              placeholder='Nama jalan, No. Rumah, RT/RW, dll'
              defaultValue={editData?.addressLine}
            />
            <FieldError errors={state.errors?.addressLine?.map(m => ({ message: m }))} />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <div className='text-sm font-medium mb-4'>Status & Sertifikasi</div>
          {/* Boolean switches will be added here */}
        </FieldGroup>

        <div className='flex justify-end gap-3 pt-4'>
          <Button type='button' variant='outline' onClick={() => closeMemberSheet()}>
            Batal
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending && <HugeiconsIcon icon={Loading03Icon} className='animate-spin mr-2' />}
            {editData ? 'Simpan Perubahan' : 'Simpan Kader'}
          </Button>
        </div>
      </form>
    )
}
