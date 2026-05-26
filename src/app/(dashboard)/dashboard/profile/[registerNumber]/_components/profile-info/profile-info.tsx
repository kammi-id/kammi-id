'use client'

import React, { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { WhatsappIcon } from '@hugeicons/core-free-icons'
import { Input } from '~/components/shadcn/ui/input'
import { Separator } from '~/components/shadcn/ui/separator'
import { Field, FieldError, FieldLabel } from '~/components/shadcn/ui/field'
import { RadioGroup, RadioGroupItem } from '~/components/shadcn/ui/radio-group'
import { cn } from '~/lib/shadcn/utils'
import { RegionCombobox } from '~/app/(dashboard)/dashboard/kader/_components/region-combobox'
import {
  fetchProvincesAction,
  fetchCitiesAction,
  fetchDistrictsAction,
  fetchVillagesAction
} from '~/app/(dashboard)/dashboard/kader/_components/add-form/action'
import type { RegionItem } from '~/lib/api/region'
import type { Member } from '~/db/query/member'

interface ProfileInfoProps {
  member: Member
  isEditing?: boolean
  fieldErrors?: Record<string, string[]>
}

const InfoRow = ({
  label,
  value,
  mono = false
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) => (
  <div className='flex min-h-[2rem] items-start gap-3 py-2'>
    <span className='text-muted-foreground font-geist-mono w-36 shrink-0 pt-0.5 text-xs tracking-wide uppercase'>
      {label}
    </span>
    <span
      className={
        mono
          ? 'font-geist-mono text-foreground text-sm'
          : 'text-foreground text-sm'
      }
    >
      {value}
    </span>
  </div>
)

const SectionDivider = ({ title }: { title: string }) => (
  <div className='mt-6 mb-1 first:mt-0'>
    <h2 className='text-foreground/60 font-geist-mono text-[11px] font-medium tracking-widest uppercase'>
      {title}
    </h2>
    <Separator className='mt-2' />
  </div>
)

const genderLabel: Record<string, string> = {
  ikhwan: 'Ikhwan (Laki-laki)',
  akhwat: 'Akhwat (Perempuan)'
}

const genderEditLabel: Record<string, string> = {
  ikhwan: 'Ikhwan',
  akhwat: 'Akhwat'
}

const deriveMemberStatusLabel = (member: Member): string => {
  if (member.isSuspended) return 'Dipecat/Diskorsing'
  if (member.isNonActive) return 'Non-Aktif'
  if (member.isAlumn) return 'Alumni'
  return 'Kader Aktif'
}

const deriveMemberStatusStyle = (member: Member): string => {
  if (member.isSuspended) return '[color:var(--status-suspended-text)]'
  if (member.isNonActive) return '[color:var(--status-nonactive-text)]'
  if (member.isAlumn) return '[color:var(--status-alumn-text)]'
  return '[color:var(--status-active-text)]'
}

const Placeholder = () => (
  <span className='text-muted-foreground/60 italic'>Tidak diisi</span>
)

export const ProfileInfo = ({
  member,
  isEditing = false,
  fieldErrors
}: ProfileInfoProps) => {
  const [selectedGender, setSelectedGender] = useState(member.gender)
  const [province, setProvince] = useState(member.addressProvinceCode ?? '')
  const [city, setCity] = useState(member.addressCityCode ?? '')
  const [district, setDistrict] = useState(member.addressDistrictCode ?? '')
  const [subdistrict, setSubdistrict] = useState(
    member.addressSubdistrictCode ?? ''
  )
  const [provinces, setProvinces] = useState<RegionItem[]>([])
  const [cities, setCities] = useState<RegionItem[]>([])
  const [districts, setDistricts] = useState<RegionItem[]>([])
  const [subdistricts, setSubdistricts] = useState<RegionItem[]>([])
  const [loadingProvince, setLoadingProvince] = useState(false)
  const [loadingCity, setLoadingCity] = useState(false)
  const [loadingDistrict, setLoadingDistrict] = useState(false)
  const [loadingSubdistrict, setLoadingSubdistrict] = useState(false)

  useEffect(() => {
    if (!isEditing) return
    let cancelled = false
    setLoadingProvince(true)
    fetchProvincesAction().then((res) => {
      if (cancelled) return
      setLoadingProvince(false)
      if (res.success) setProvinces(res.data ?? [])
    })
    return () => { cancelled = true }
  }, [isEditing])

  useEffect(() => {
    if (!province) {
      setCities([])
      setDistricts([])
      setSubdistricts([])
      return
    }
    let cancelled = false
    setLoadingCity(true)
    fetchCitiesAction(province).then((res) => {
      if (cancelled) return
      setLoadingCity(false)
      if (res.success) setCities(res.data ?? [])
    })
    return () => { cancelled = true }
  }, [province])

  useEffect(() => {
    if (!city) {
      setDistricts([])
      setSubdistricts([])
      return
    }
    let cancelled = false
    setLoadingDistrict(true)
    fetchDistrictsAction(city).then((res) => {
      if (cancelled) return
      setLoadingDistrict(false)
      if (res.success) setDistricts(res.data ?? [])
    })
    return () => { cancelled = true }
  }, [city])

  useEffect(() => {
    if (!district) {
      setSubdistricts([])
      return
    }
    let cancelled = false
    setLoadingSubdistrict(true)
    fetchVillagesAction(district).then((res) => {
      if (cancelled) return
      setLoadingSubdistrict(false)
      if (res.success) setSubdistricts(res.data ?? [])
    })
    return () => { cancelled = true }
  }, [district])

  const getRegionName = (options: RegionItem[], code: string) =>
    options.find((o) => o.code === code)?.name ?? ''

  const cleanPhone = member.phone?.replace(/\D/g, '').replace(/^0/, '62')

  const addressParts = [
    member.addressLine,
    member.addressSubdistrict,
    member.addressDistrict,
    member.addressCity,
    member.addressProvince
  ].filter(Boolean)

  if (isEditing) {
    return (
      <section>
        <SectionDivider title='Data Diri' />

        <div className='flex flex-col gap-4'>
          <Field>
            <FieldLabel
              htmlFor='name'
              className='font-geist-mono text-xs tracking-wide uppercase'
            >
              Nama Lengkap
            </FieldLabel>
            <Input id='name' name='name' defaultValue={member.name} required />
            <FieldError
              errors={fieldErrors?.name?.map((m) => ({ message: m }))}
            />
          </Field>

          <Field>
            <FieldLabel className='font-geist-mono text-xs tracking-wide uppercase'>
              Gender
            </FieldLabel>
            <RadioGroup
              name='gender'
              value={selectedGender}
              onValueChange={setSelectedGender}
              className='flex gap-3'
            >
              {(['ikhwan', 'akhwat'] as const).map((val) => (
                <label
                  key={val}
                  htmlFor={`gender-${val}`}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                    selectedGender === val
                      ? '[border-color:var(--form-gender-selected-border)] [background-color:var(--form-gender-selected-bg)] [color:var(--form-gender-selected-text)]'
                      : 'border-border text-foreground hover:[border-color:var(--form-gender-hover-border)]'
                  )}
                >
                  <RadioGroupItem
                    value={val}
                    id={`gender-${val}`}
                    className='sr-only'
                  />
                  <span className='font-medium capitalize'>
                    {genderEditLabel[val]}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </Field>

          <Field>
            <FieldLabel
              htmlFor='yearOfEntry'
              className='font-geist-mono text-xs tracking-wide uppercase'
            >
              Tahun Masuk
            </FieldLabel>
            <Input
              id='yearOfEntry'
              name='yearOfEntry'
              type='number'
              min='1998'
              max={new Date().getFullYear()}
              defaultValue={member.yearOfEntry ?? ''}
              required
            />
            <FieldError
              errors={fieldErrors?.yearOfEntry?.map((m) => ({ message: m }))}
            />
          </Field>

          <Field>
            <FieldLabel
              htmlFor='phone'
              className='font-geist-mono text-xs tracking-wide uppercase'
            >
              No. HP / WhatsApp
            </FieldLabel>
            <Input
              id='phone'
              name='phone'
              placeholder='08123456789'
              defaultValue={member.phone ?? ''}
            />
          </Field>
        </div>

        <SectionDivider title='Alamat' />

        <div className='flex flex-col gap-4'>
          <Field>
            <FieldLabel className='font-geist-mono text-xs tracking-wide uppercase'>
              Provinsi
            </FieldLabel>
            <RegionCombobox
              value={province}
              options={provinces}
              placeholder='Pilih Provinsi'
              isLoading={loadingProvince}
              onValueChange={(val) => {
                setProvince(val)
                setCity('')
                setDistrict('')
                setSubdistrict('')
              }}
            />
            <input
              type='hidden'
              name='addressProvince'
              value={getRegionName(provinces, province)}
            />
            <input type='hidden' name='addressProvinceCode' value={province} />
          </Field>

          <Field>
            <FieldLabel className='font-geist-mono text-xs tracking-wide uppercase'>
              Kota/Kabupaten
            </FieldLabel>
            <RegionCombobox
              value={city}
              options={cities}
              placeholder='Pilih Kota/Kabupaten'
              isLoading={loadingCity}
              onValueChange={(val) => {
                setCity(val)
                setDistrict('')
                setSubdistrict('')
              }}
              disabled={!province}
            />
            <input
              type='hidden'
              name='addressCity'
              value={getRegionName(cities, city)}
            />
            <input type='hidden' name='addressCityCode' value={city} />
          </Field>

          <Field>
            <FieldLabel className='font-geist-mono text-xs tracking-wide uppercase'>
              Kecamatan
            </FieldLabel>
            <RegionCombobox
              value={district}
              options={districts}
              placeholder='Pilih Kecamatan'
              isLoading={loadingDistrict}
              onValueChange={(val) => {
                setDistrict(val)
                setSubdistrict('')
              }}
              disabled={!city}
            />
            <input
              type='hidden'
              name='addressDistrict'
              value={getRegionName(districts, district)}
            />
            <input type='hidden' name='addressDistrictCode' value={district} />
          </Field>

          <Field>
            <FieldLabel className='font-geist-mono text-xs tracking-wide uppercase'>
              Kelurahan/Desa
            </FieldLabel>
            <RegionCombobox
              value={subdistrict}
              options={subdistricts}
              placeholder='Pilih Kelurahan/Desa'
              isLoading={loadingSubdistrict}
              onValueChange={setSubdistrict}
              disabled={!district}
            />
            <input
              type='hidden'
              name='addressSubdistrict'
              value={getRegionName(subdistricts, subdistrict)}
            />
            <input
              type='hidden'
              name='addressSubdistrictCode'
              value={subdistrict}
            />
          </Field>

          <Field>
            <FieldLabel
              htmlFor='addressLine'
              className='font-geist-mono text-xs tracking-wide uppercase'
            >
              Alamat Lengkap
            </FieldLabel>
            <Input
              id='addressLine'
              name='addressLine'
              placeholder='Nama jalan, No. Rumah, RT/RW, dll'
              defaultValue={member.addressLine ?? ''}
            />
          </Field>
        </div>
      </section>
    )
  }

  return (
    <section>
      <SectionDivider title='Data Diri' />
      <div className='divide-border/60 divide-y'>
        <InfoRow
          label='Gender'
          value={genderLabel[member.gender] ?? member.gender}
        />
        <InfoRow
          label='Tahun Masuk'
          value={member.yearOfEntry ?? <Placeholder />}
        />
        <InfoRow
          label='Status'
          value={
            <span className={deriveMemberStatusStyle(member)}>
              {deriveMemberStatusLabel(member)}
            </span>
          }
        />
      </div>

      <SectionDivider title='Kontak & Alamat' />
      <div className='divide-border/60 divide-y'>
        <InfoRow
          label='No. HP'
          value={
            member.phone?.trim() ? (
              <span className='flex items-center gap-3'>
                <a
                  href={`tel:${member.phone}`}
                  className='hover:text-primary transition-colors'
                >
                  {member.phone}
                </a>
                <a
                  href={`https://wa.me/${cleanPhone}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label='Hubungi via WhatsApp'
                  className='flex items-center gap-1 [color:var(--status-pass-text)] transition-opacity hover:opacity-80'
                >
                  <HugeiconsIcon icon={WhatsappIcon} className='size-3.5' />
                  <span className='text-xs'>WhatsApp</span>
                </a>
              </span>
            ) : (
              <Placeholder />
            )
          }
        />
        <InfoRow
          label='Provinsi'
          value={member.addressProvince || <Placeholder />}
        />
        <InfoRow
          label='Kota/Kab'
          value={member.addressCity || <Placeholder />}
        />
        <InfoRow
          label='Kecamatan'
          value={member.addressDistrict || <Placeholder />}
        />
        <InfoRow
          label='Kelurahan'
          value={member.addressSubdistrict || <Placeholder />}
        />
        <InfoRow
          label='Alamat'
          value={
            addressParts.length > 0 ? (
              <span className='leading-relaxed'>
                {member.addressLine ?? addressParts.join(', ')}
              </span>
            ) : (
              <Placeholder />
            )
          }
        />
      </div>
    </section>
  )
}
