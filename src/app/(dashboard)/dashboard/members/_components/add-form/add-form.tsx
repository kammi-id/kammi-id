'use client'

import * as React from 'react'
import { useActionState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { toast } from 'sonner'
import { cn } from '~/lib/shadcn/utils'
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
import { RegionCombobox } from '../region-combobox'
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
import { ImageUpload } from '~/components/image-upload'
import { deleteImageAction } from '~/lib/actions/storage'
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
 */
export const AddMemberForm = ({ organizationId }: AddMemberFormProps) => {
  const currentYear = getCurrentYear()
  const editData = useStore(memberEditData)

  // 1. Declare Action State FIRST to avoid ReferenceErrors in subsequent hooks
  const [state, action, isPending] = useActionState(
    async (prevState: MemberFormState, formData: FormData) => {
      if (editData) {
        return updateMemberAction(prevState, formData)
      }
      return createMemberAction(prevState, formData)
    },
    { success: false } as MemberFormState
  )

  // 2. Other states
  const [regionData, setRegionData] =
    React.useState<RegionDataState>(INITIAL_REGION_DATA)
  const [isLoading, setIsLoading] = React.useState<RegionLoadingState>(
    INITIAL_LOADING_STATE
  )
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
  const [photo, setPhoto] = React.useState(() => editData?.photo ?? '')
  const [isInitializing, setIsInitializing] = React.useState(true)
  const [hasChanges, setHasChanges] = React.useState(false)
  const [selectedGender, setSelectedGender] = React.useState(
    editData?.gender ?? 'ikhwan'
  )
  const [selectedStatus, setSelectedStatus] = React.useState(
    editData?.status ?? 'ab1'
  )

  const getRegionName = (options: RegionItem[] | undefined, code: string) =>
    options?.find((opt) => opt.code === code)?.name ?? ''

  // 3. Effects (all hooks now have access to state)
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
      setSelectedGender(editData.gender ?? 'ikhwan')
      setSelectedStatus(editData.status ?? 'ab1')
      setPhoto(editData.photo ?? '')
    } else if (state?.values) {
      setProvince(state.values.addressProvinceCode || '')
      setCity(state.values.addressCityCode || '')
      setDistrict(state.values.addressDistrictCode || '')
      setSubdistrict(state.values.addressSubdistrictCode || '')
      setIsAlumn(state.values.isAlumn === 'true')
      setIsSuspended(state.values.isSuspended === 'true')
      setIsNonActive(state.values.isNonActive === 'true')
      setIsCertifiedMentor(state.values.isCertifiedMentor === 'true')
      setIsCertifiedInstructor(state.values.isCertifiedInstructor === 'true')
      setSelectedGender(state.values.gender ?? 'ikhwan')
      setSelectedStatus(state.values.status ?? 'ab1')
      setPhoto(state.values.photo || '')
    }
    setIsInitializing(false)
  }, [editData, state?.values])

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message)
      closeMemberSheet()
    } else if (state?.message) {
      toast.error(state.message)
    }
  }, [state])

  useEffect(() => {
    return () => {
      if (photo && photo !== (editData?.photo ?? '')) {
        deleteImageAction(photo)
      }
    }
  }, [photo, editData])

  const handleInputChange = React.useCallback(() => {
    if (editData) setHasChanges(true)
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
        setRegionData((prev) => ({ ...prev, districts: res.data || [] }))
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
          <h3 className='font-heading mb-4 text-lg font-semibold'>Data Diri</h3>
          <Field>
            <FieldLabel htmlFor='name'>Nama Lengkap</FieldLabel>
            <Input
              id='name'
              name='name'
              placeholder='Masukkan nama lengkap'
              defaultValue={editData?.name ?? state?.values?.name ?? ''}
              onChange={handleInputChange}
              required
            />
            <FieldError
              errors={state?.errors?.name?.map((m) => ({ message: m }))}
            />
          </Field>

          <Field className='mt-4'>
            <ImageUpload
              label='Foto Anggota'
              folder='members'
              value={photo}
              onChange={(path) => {
                setPhoto(path)
                handleInputChange()
              }}
            />
            <input type='hidden' name='photo' value={photo} />
          </Field>

          <div className='mt-4 flex flex-col gap-6'>
            <Field>
              <FieldLabel>Gender</FieldLabel>
              <RadioGroup
                name='gender'
                value={selectedGender}
                onValueChange={(val) => {
                  setSelectedGender(val)
                  handleInputChange()
                }}
                className='grid grid-cols-2 gap-3'
              >
                {['ikhwan', 'akhwat'].map((val) => (
                  <FieldLabel
                    key={val}
                    htmlFor={`gender-${val}`}
                    className={cn(
                      'cursor-pointer rounded-xl border-2 p-3 transition-all',
                      selectedGender === val
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/20 bg-background hover:border-primary/50'
                    )}
                  >
                    <Field orientation='horizontal'>
                      <FieldContent className='flex-1'>
                        <FieldTitle className='flex items-center justify-center gap-2 text-center font-semibold capitalize'>
                          <HugeiconsIcon
                            icon={UserIcon}
                            strokeWidth={2}
                            className='size-4'
                          />
                          {val}
                        </FieldTitle>
                        <FieldDescription className='text-center text-xs'>
                          {getGenderLabel(val)}
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        value={val}
                        id={`gender-${val}`}
                        className='sr-only'
                      />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <RadioGroup
                name='status'
                value={selectedStatus}
                onValueChange={(val) => {
                  setSelectedStatus(val)
                  handleInputChange()
                }}
                className='grid grid-cols-3 gap-2'
              >
                {['ab1', 'ab2', 'ab3'].map((val) => (
                  <FieldLabel
                    key={val}
                    htmlFor={`status-${val}`}
                    className={cn(
                      'cursor-pointer rounded-xl border-2 p-2 transition-all',
                      selectedStatus === val
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted-foreground/20 bg-background hover:border-primary/50'
                    )}
                  >
                    <Field orientation='horizontal'>
                      <FieldContent className='flex-1'>
                        <FieldTitle className='flex items-center justify-center gap-2 text-center text-xs font-semibold uppercase'>
                          <HugeiconsIcon
                            icon={Award01Icon}
                            strokeWidth={2}
                            className='size-3'
                          />
                          {val}
                        </FieldTitle>
                        <FieldDescription className='text-center text-[10px] leading-tight'>
                          {getStatusLabel(val)}
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        value={val}
                        id={`status-${val}`}
                        className='sr-only'
                      />
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
              defaultValue={editData?.phone ?? state?.values?.phone ?? ''}
              onChange={handleInputChange}
            />
            <FieldError
              errors={state?.errors?.phone?.map((m) => ({ message: m }))}
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
              defaultValue={
                editData?.yearOfEntry ??
                state?.values?.yearOfEntry ??
                currentYear
              }
              onChange={handleInputChange}
              required
            />
            <FieldError
              errors={state?.errors?.yearOfEntry?.map((m) => ({ message: m }))}
            />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <h3 className='font-heading mb-4 text-lg font-semibold'>Alamat</h3>
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
                  handleInputChange()
                  if (!isInitializing) {
                    setCity('')
                    setDistrict('')
                    setSubdistrict('')
                  }
                }}
              />
              <input
                type='hidden'
                name='addressProvince'
                value={getRegionName(regionData.provinces, province)}
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
                  handleInputChange()
                  if (!isInitializing) {
                    setDistrict('')
                    setSubdistrict('')
                  }
                }}
                disabled={!province}
              />
              <input
                type='hidden'
                name='addressCity'
                value={getRegionName(regionData.cities, city)}
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
                  handleInputChange()
                  if (!isInitializing) {
                    setSubdistrict('')
                  }
                }}
                disabled={!city}
              />
              <input
                type='hidden'
                name='addressDistrict'
                value={getRegionName(regionData.districts, district)}
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
                  handleInputChange()
                }}
                disabled={!district}
              />
              <input
                type='hidden'
                name='addressSubdistrict'
                value={getRegionName(regionData.subdistricts, subdistrict)}
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
              defaultValue={
                editData?.addressLine ?? state?.values?.addressLine ?? undefined
              }
              onChange={handleInputChange}
            />
            <FieldError
              errors={state?.errors?.addressLine?.map((m) => ({ message: m }))}
            />
          </Field>
        </FieldGroup>

        <FieldGroup>
          <h3 className='font-heading mb-4 text-lg font-semibold'>
            Status & Sertifikasi
          </h3>
          <div className='flex flex-col gap-4'>
            <Field orientation='horizontal' className='justify-between gap-4'>
              <FieldLabel htmlFor='isCertifiedMentor'>Pemandu</FieldLabel>
              <div className='flex items-center gap-2'>
                <Switch
                  id='isCertifiedMentor'
                  checked={isCertifiedMentor}
                  onCheckedChange={(val) => {
                    setIsCertifiedMentor(val)
                    handleInputChange()
                  }}
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
                  onCheckedChange={(val) => {
                    setIsCertifiedInstructor(val)
                    handleInputChange()
                  }}
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
                  onCheckedChange={(val) => {
                    setIsAlumn(val)
                    handleInputChange()
                  }}
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
                  onCheckedChange={(val) => {
                    setIsNonActive(val)
                    handleInputChange()
                  }}
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
                  onCheckedChange={(val) => {
                    setIsSuspended(val)
                    handleInputChange()
                  }}
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
        <Button
          type='submit'
          disabled={isPending || (!!editData && !hasChanges)}
        >
          {isPending && (
            <HugeiconsIcon icon={Loading03Icon} className='mr-2 animate-spin' />
          )}
          {editData ? 'Simpan Perubahan' : 'Simpan Kader'}
        </Button>
      </div>
    </form>
  )
}
