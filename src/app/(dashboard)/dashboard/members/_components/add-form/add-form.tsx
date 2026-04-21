'use client'

import * as React from 'react'
import { useActionState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import { Input } from '~/components/shadcn/ui/input'
import { Switch } from '~/components/shadcn/ui/switch'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldContent,
  FieldTitle,
  FieldDescription
} from '~/components/shadcn/ui/field'
import { RadioGroup, RadioGroupItem } from '~/components/shadcn/ui/radio-group'
import { RegionCombobox } from '../region-combobox
import {
  createMemberAction,
  updateMemberAction,
  fetchProvincesAction,
  fetchCitiesAction,
  fetchDistrictsAction,
  fetchVillagesAction,
  type MemberFormState
} from './action'
import { memberSheetStore, memberEditData, closeMemberSheet } from './store'
import { getCurrentYear, getGenderLabel, getStatusLabel } from './utils'
import { INITIAL_REGION_DATA, INITIAL_LOADING_STATE } from './constants'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Loading03Icon,
  UserIcon,
  Award01Icon
} from '@hugeicons/core-free-icons'
import type { RegionItem } from '~/lib/api/region'
import type {
  AddMemberFormProps,
  RegionDataState,
  RegionLoadingState
} from './types'

/**
 * AddMemberForm component provides a comprehensive form for adding or updating member data.
 *
 * It manages complex state for personal information, hierarchical address selection
 * (Province -> City -> District -> Village), and certification/status flags.
 * The form handles both creation and editing modes based on the `memberEditData` store.
 *
 * @param props - Component properties.
 * @param props.organizationId - The ID of the organization to which the member will be added.
 * @returns A form element with scrollable content sections and sticky action buttons.
 */
export const AddMemberForm = ({ organizationId }: AddMemberFormProps) => {
  const currentYear = getCurrentYear()
  const editData = useStore(memberEditData)

  const [regionData, setRegionData] =
    React.useState<RegionDataState>(INITIAL_REGION_DATA)

  const [isLoading, setIsLoading] =
    React.useState<RegionLoadingState>(INITIAL_LOADING_STATE)

  const [province, setProvince] = React.useState(
    () => editData?.addressProvinceCode ?? ''
  )
  const [city, setCity] = React.useState(() => editData?.addressCityCode ?? '')
  const [district, setDistrict] = React.useState(
    () => editData?.addressDistrictCode ?? ''
  )
  const [subdistrict, setSubdistrict] = React.useState(
    () => editData?.addressSubdistrictCode ?? ''
  )

  const [isAlumn, setIsAlumn] = React.useState(editData?.isAlumn ?? false)
  const [isSuspended, setIsSuspended] = React.useState(
    editData?.isSuspended ?? false
  )
  const [isNonActive, setIsNonActive] = React.useState(
    editData?.isNonActive ?? false
  )
  const [isCertifiedMentor, setIsCertifiedMentor] = React.useState(
    editData?.isCertifiedMentor ?? false
  )
  const [isCertifiedInstructor, setIsCertifiedInstructor] = React.useState(
    editData?.isCertifiedInstructor ?? false
  )

  useEffect(() => {
    if (editData) {
      setProvince(editData.addressProvinceCode || '')
      setCity(editData.addressCityCode || '')
      setDistrict(editData.addressDistrictCode || '')
      setSubdistrict(editData.addressSubdistrictCode || '')
      setIsAlumn(editData.isAlumn ?? false)
      setIsSuspended(editData.isSuspended ?? false)
      setIsNonActive(editData.isNonActive ?? false)
      setIsCertifiedMentor(editData.isCertifiedMentor ?? false)
      setIsCertifiedInstructor(editData.isCertifiedInstructor ?? false)
    }
  }, [editData])

  useEffect(() => {
    let isCurrent = true
    const loadProvinces = async () => {
      setIsLoading((prev) => ({ ...prev, province: true }))
      const res = await fetchProvincesAction()
      if (!isCurrent) return
      setIsLoading((prev) => ({ ...prev, province: false }))
      if (res.success) {
        setRegionData((prev) => ({ ...prev, provinces: res.data || [] }))
      } else {
        toast.error(res.error)
      }
    }
    loadProvinces()
    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (!province) return
    let isCurrent = true
    const loadCities = async () => {
      setIsLoading((prev) => ({ ...prev, city: true }))
      const res = await fetchCitiesAction(province)
      if (!isCurrent) return
      setIsLoading((prev) => ({ ...prev, city: false }))
      if (res.success) {
        setRegionData((prev) => ({ ...prev, cities: res.data || [] }))
      } else {
        toast.error(res.error)
      }
    }
    loadCities()
    return () => {
      isCurrent = false
    }
  }, [province])

  useEffect(() => {
    if (!city) return
    let isCurrent = true
    const loadDistricts = async () => {
      setIsLoading((prev) => ({ ...prev, district: true }))
      const res = await fetchDistrictsAction(city)
      if (!isCurrent) return
      setIsLoading((prev) => ({ ...prev, district: false }))
      if (res.success) {
        const updatedData = { ...regionData, districts: res.data || [] }
        setRegionData(updatedData)
      } else {
        toast.error(res.error)
      }
    }
    loadDistricts()
    return () => {
      isCurrent = false
    }
  }, [city])

  useEffect(() => {
    if (!district) return
    let isCurrent = true
    const loadSubdistricts = async () => {
      setIsLoading((prev) => ({ ...prev, subdistrict: true }))
      const res = await fetchVillagesAction(district)
      if (!isCurrent) return
      setIsLoading((prev) => ({ ...prev, subdistrict: false }))
      if (res.success) {
        setRegionData((prev) => ({ ...prev, subdistricts: res.data || [] }))
      } else {
        toast.error(res.error)
      }
    }
    loadSubdistricts()
    return () => {
      isCurrent = false
    }
  }, [district])

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
    <form
      id='add-member-form'
      action={action}
      className='flex h-full max-h-[calc(100vh-120px)] flex-col'
    >
      <div className='flex-1 space-y-6 overflow-y-auto p-6'>
        <input type='hidden' name='organizationId' value={organizationId} />
        {editData && <input type='hidden' name='id' value={editData.id} />}

        <FieldGroup>
          <h3 className='mb-4 text-lg font-semibold'>Data Diri</h3>
          <Field>
            <FieldLabel htmlFor='name'>Nama Lengkap</FieldLabel>
            <Input
              id='name'
              name='name'
              placeholder='Masukkan nama lengkap'
              defaultValue={editData?.name}
              required
            />
            <FieldError
              errors={state.errors?.name?.map((m) => ({ message: m }))}
            />
          </Field>

          <div className='mt-4 flex flex-col gap-6'>
            <Field>
              <FieldLabel>Gender</FieldLabel>
              <RadioGroup
                name='gender'
                defaultValue={editData?.gender ?? 'ikhwan'}
                className='flex flex-col gap-3'
              >
                {['ikhwan', 'akhwat'].map((val) => (
                  <FieldLabel
                    key={val}
                    htmlFor={`gender-${val}`}
                    className='cursor-pointer'
                  >
                    <Field orientation='horizontal'>
                      <FieldContent>
                        <FieldTitle className='flex items-center gap-2 capitalize'>
                          <HugeiconsIcon
                            icon={UserIcon}
                            strokeWidth={2}
                            className='size-4'
                          />
                          {val}
                        </FieldTitle>
                        <FieldDescription>
                          {getGenderLabel(val)}
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={val} id={`gender-${val}`} />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <RadioGroup
                name='status'
                defaultValue={editData?.status ?? 'ab1'}
                className='flex flex-col gap-3'
              >
                {['ab1', 'ab2', 'ab3'].map((val) => (
                  <FieldLabel
                    key={val}
                    htmlFor={`status-${val}`}
                    className='cursor-pointer'
                  >
                    <Field orientation='horizontal'>
                      <FieldContent>
                        <FieldTitle className='flex items-center gap-2 uppercase'>
                          <HugeiconsIcon
                            icon={Award01Icon}
                            strokeWidth={2}
                            className='size-4'
                          />
                          {val}
                        </FieldTitle>
                        <FieldDescription>
                          {getStatusLabel(val)}
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem value={val} id={`status-${val}`} />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </Field>
          </div>

          <Field className='mt-6'>
            <FieldLabel htmlFor='phone'>No. HP / WhatsApp</FieldLabel>
            <Input
              id='phone'
              name='phone'
              placeholder='Contoh: 08123456789'
              defaultValue={editData?.phone ?? ''}
            />
            <FieldError
              errors={state.errors?.phone?.map((m) => ({ message: m }))}
            />
          </Field>

          <Field className='mt-4'>
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
            <FieldError
              errors={state.errors?.yearOfEntry?.map((m) => ({ message: m }))}
            />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <h3 className='mb-4 text-lg font-semibold'>Alamat</h3>
          <div className='flex flex-col gap-4'>
            <Field>
              <FieldLabel htmlFor='addressProvince'>Provinsi</FieldLabel>
              <RegionCombobox
                value={province}
                options={regionData.provinces}
                placeholder='Pilih Provinsi'
                isLoading={isLoading.province}
                onValueChange={(val) => {
                  setProvince(val)
                  setCity('')
                  setDistrict('')
                  setSubdistrict('')
                }}
              />
              <input
                type='hidden'
                name='addressProvinceCode'
                value={province ?? ''}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor='addressCity'>Kota/Kabupaten</FieldLabel>
              <RegionCombobox
                value={city}
                options={regionData.cities}
                placeholder='Pilih Kota/Kabupaten'
                isLoading={isLoading.city}
                onValueChange={(val) => {
                  setCity(val)
                  setDistrict('')
                  setSubdistrict('')
                }}
                disabled={!province}
              />
              <input type='hidden' name='addressCityCode' value={city ?? ''} />
            </Field>

            <Field>
              <FieldLabel htmlFor='addressDistrict'>Kecamatan</FieldLabel>
              <RegionCombobox
                value={district}
                options={regionData.districts}
                placeholder='Pilih Kecamatan'
                isLoading={isLoading.district}
                onValueChange={(val) => {
                  setDistrict(val)
                  setSubdistrict('')
                }}
                disabled={!city}
              />
              <input
                type='hidden'
                name='addressDistrictCode'
                value={district ?? ''}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor='addressSubdistrict'>
                Kelurahan/Desa
              </FieldLabel>
              <RegionCombobox
                value={subdistrict}
                options={regionData.subdistricts}
                placeholder='Pilih Kelurahan/Desa'
                isLoading={isLoading.subdistrict}
                onValueChange={(val) => {
                  setSubdistrict(val)
                }}
                disabled={!district}
              />
              <input
                type='hidden'
                name='addressSubdistrictCode'
                value={subdistrict ?? ''}
              />
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
            <FieldError
              errors={state.errors?.addressLine?.map((m) => ({ message: m }))}
            />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <h3 className='mb-4 text-lg font-semibold'>Status & Sertifikasi</h3>
          <div className='flex flex-col gap-4'>
            <Field orientation='horizontal' className='justify-between gap-4'>
              <FieldLabel htmlFor='isCertifiedMentor'>Pemandu</FieldLabel>
              <div className='flex items-center gap-2'>
                <Switch
                  id='isCertifiedMentor'
                  checked={isCertifiedMentor}
                  onCheckedChange={setIsCertifiedMentor}
                />
                <input
                  type='hidden'
                  name='isCertifiedMentor'
                  value={isCertifiedMentor ? 'true' : 'false'}
                />
              </div>
            </Field>
            <Field orientation='horizontal' className='justify-between gap-4'>
              <FieldLabel htmlFor='isCertifiedInstructor'>
                Instruktur
              </FieldLabel>
              <div className='flex items-center gap-2'>
                <Switch
                  id='isCertifiedInstructor'
                  checked={isCertifiedInstructor}
                  onCheckedChange={setIsCertifiedInstructor}
                />
                <input
                  type='hidden'
                  name='isCertifiedInstructor'
                  value={isCertifiedInstructor ? 'true' : 'false'}
                />
              </div>
            </Field>

            <div className='my-2' />

            <Field orientation='horizontal' className='justify-between gap-4'>
              <FieldLabel htmlFor='isAlumn'>Alumni</FieldLabel>
              <div className='flex items-center gap-2'>
                <Switch
                  id='isAlumn'
                  checked={isAlumn}
                  onCheckedChange={setIsAlumn}
                />
                <input
                  type='hidden'
                  name='isAlumn'
                  value={isAlumn ? 'true' : 'false'}
                />
              </div>
            </Field>
            <Field orientation='horizontal' className='justify-between gap-4'>
              <FieldLabel htmlFor='isNonActive'>Non-Aktif</FieldLabel>
              <div className='flex items-center gap-2'>
                <Switch
                  id='isNonActive'
                  checked={isNonActive}
                  onCheckedChange={setIsNonActive}
                />
                <input
                  type='hidden'
                  name='isNonActive'
                  value={isNonActive ? 'true' : 'false'}
                />
              </div>
            </Field>
            <Field orientation='horizontal' className='justify-between gap-4'>
              <FieldLabel htmlFor='isSuspended'>Skorsing</FieldLabel>
              <div className='flex items-center gap-2'>
                <Switch
                  id='isSuspended'
                  checked={isSuspended}
                  onCheckedChange={setIsSuspended}
                />
                <input
                  type='hidden'
                  name='isSuspended'
                  value={isSuspended ? 'true' : 'false'}
                />
              </div>
            </Field>
          </div>
        </FieldGroup>
      </div>

      <div className='bg-background sticky bottom-0 flex justify-end gap-3 border-t p-6'>
        <Button
          type='button'
          variant='outline'
          onClick={() => closeMemberSheet()}
        >
          Batal
        </Button>
        <Button type='submit' disabled={isPending}>
          {isPending && (
            <HugeiconsIcon icon={Loading03Icon} className='mr-2 animate-spin' />
          )}
          {editData ? 'Simpan Perubahan' : 'Simpan Kader'}
        </Button>
      </div>
    </form>
  )
}
