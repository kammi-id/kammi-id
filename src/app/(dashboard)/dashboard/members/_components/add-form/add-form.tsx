'use client'

import * as React from 'react'
import { useActionState, useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { toast } from 'sonner'
import { Button } from '~/components/shadcn/ui/button'
import {
  createMemberAction,
  updateMemberAction,
  type MemberFormState
} from './action'
import { memberEditData, closeMemberSheet } from './store'
import { getCurrentYear } from './utils'
import { HugeiconsIcon } from '@hugeicons/react'
import { Loading03Icon } from '@hugeicons/core-free-icons'
import type { AddMemberFormProps } from './types'

import { useMemberRegion } from './use-member-region'
import { PersonalInfoSection } from './personal-info-section'
import { AddressSection } from './address-section'
import { StatusSection } from './status-section'

export const AddMemberForm = ({ organizationId }: AddMemberFormProps) => {
  const currentYear = getCurrentYear()
  const editData = useStore(memberEditData)

  // 1. Action State
  const [state, action, isPending] = useActionState(
    async (prevState: MemberFormState, formData: FormData) => {
      if (editData) {
        return updateMemberAction(prevState, formData)
      }
      return createMemberAction(prevState, formData)
    },
    { success: false } as MemberFormState
  )

  // 2. Region State via Custom Hook
  const {
    regionData,
    isLoading,
    province,
    setProvince,
    city,
    setCity,
    district,
    setDistrict,
    subdistrict,
    setSubdistrict,
    getRegionName
  } = useMemberRegion(
    editData?.addressProvinceCode ?? '',
    editData?.addressCityCode ?? '',
    editData?.addressDistrictCode ?? '',
    editData?.addressSubdistrictCode ?? ''
  )

  // 3. Local States
  const [isAlumn, setIsAlumn] = React.useState(editData?.isAlumn ?? false)
  const [isSuspended, setIsSuspended] = React.useState(editData?.isSuspended ?? false)
  const [isNonActive, setIsNonActive] = React.useState(editData?.isNonActive ?? false)
  const [isCertifiedMentor, setIsCertifiedMentor] = React.useState(editData?.isCertifiedMentor ?? false)
  const [isCertifiedInstructor, setIsCertifiedInstructor] = React.useState(editData?.isCertifiedInstructor ?? false)
  const [photo, setPhoto] = React.useState(() => editData?.photo ?? '')
  const [hasChanges, setHasChanges] = React.useState(false)
  const [selectedGender, setSelectedGender] = React.useState(editData?.gender ?? 'ikhwan')
  const [selectedStatus, setSelectedStatus] = React.useState(editData?.status ?? 'ab1')
  const [isInitializing, setIsInitializing] = React.useState(true)

  // 4. Effects
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
        // Note: deleteImageAction should be imported if needed here,
        // but it was in the original code. Let's keep it consistent.
      }
    }
  }, [photo, editData])

  const handleInputChange = React.useCallback(() => {
    if (editData) setHasChanges(true)
  }, [editData])

  return (
    <form
      id='add-member-form'
      action={action}
      className='flex h-full max-h-[calc(100vh-120px)] flex-col'
    >
      <div className='flex-1 space-y-6 overflow-y-auto p-6'>
        <input type='hidden' name='organizationId' value={organizationId} />
        {editData && <input type='hidden' name='id' value={editData.id} />}

        <PersonalInfoSection
          editData={editData}
          state={state}
          photo={photo}
          setPhoto={setPhoto}
          selectedGender={selectedGender}
          setSelectedGender={setSelectedGender}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          currentYear={currentYear}
          handleInputChange={handleInputChange}
        />

        <AddressSection
          regionData={regionData}
          isLoading={isLoading}
          province={province}
          setProvince={setProvince}
          city={city}
          setCity={setCity}
          district={district}
          setDistrict={setDistrict}
          subdistrict={subdistrict}
          setSubdistrict={setSubdistrict}
          getRegionName={getRegionName}
          isInitializing={isInitializing}
          handleInputChange={handleInputChange}
          state={state}
        />

        <StatusSection
          isCertifiedMentor={isCertifiedMentor}
          setIsCertifiedMentor={setIsCertifiedMentor}
          isCertifiedInstructor={isCertifiedInstructor}
          setIsCertifiedInstructor={setIsCertifiedInstructor}
          isAlumn={isAlumn}
          setIsAlumn={setIsAlumn}
          isNonActive={isNonActive}
          setIsNonActive={setIsNonActive}
          isSuspended={isSuspended}
          setIsSuspended={setIsSuspended}
          handleInputChange={handleInputChange}
        />
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
