'use client'

import * as React from 'react'
import { Input } from '~/components/shadcn/ui/input'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '~/components/shadcn/ui/field'
import { RegionCombobox } from '../region-combobox'

interface AddressSectionProps {
  regionData: any
  isLoading: any
  province: string
  setProvince: (val: string) => void
  city: string
  setCity: (val: string) => void
  district: string
  setDistrict: (val: string) => void
  subdistrict: string
  setSubdistrict: (val: string) => void
  getRegionName: (options: any[], code: string) => string
  isInitializing: boolean
  handleInputChange: () => void
  state?: any
}

export const AddressSection = ({
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
  getRegionName,
  isInitializing,
  handleInputChange,
  state
}: AddressSectionProps) => {
  return (
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
          <FieldLabel htmlFor='addressSubdistrict'>Kelurahan/Desa</FieldLabel>
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
          defaultValue={state?.values?.addressLine ?? undefined}
          onChange={handleInputChange}
        />
        <FieldError
          errors={state?.errors?.addressLine?.map((m: string) => ({
            message: m
          }))}
        />
      </Field>
    </FieldGroup>
  )
}
