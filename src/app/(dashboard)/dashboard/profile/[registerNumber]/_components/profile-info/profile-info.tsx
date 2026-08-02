'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { WhatsappIcon, ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { Input } from '~/components/shadcn/ui/input'
import { Button } from '~/components/shadcn/ui/button'
import { Separator } from '~/components/shadcn/ui/separator'
import { Field, FieldError, FieldLabel } from '~/components/shadcn/ui/field'
import { SectionDivider } from '../section-divider'
import { RadioGroup, RadioGroupItem } from '~/components/shadcn/ui/radio-group'
import { cn } from '~/lib/shadcn/utils'
import { RegionCombobox } from '~/app/(dashboard)/dashboard/kader/_components/region-combobox'
import {
  fetchProvincesAction,
  fetchCitiesAction,
  fetchDistrictsAction,
  fetchVillagesAction
} from '~/app/(dashboard)/dashboard/kader/_components/add-form'
import type { RegionItem } from '~/lib/api/region'
import type { Member } from '~/db/query/member'
import { useProfileEdit } from '../profile-edit-context'

const InfoRow = ({
  label,
  value,
  mono = false
}: {
  label: string
  value: ReactNode
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

const genderLabel: Record<string, string> = {
  ikhwan: 'Ikhwan (Laki-laki)',
  akhwat: 'Akhwat (Perempuan)'
}

const genderEditLabel: Record<string, string> = {
  ikhwan: 'Ikhwan',
  akhwat: 'Akhwat'
}

const deriveMemberStatusLabel = (member: Member): string => {
  if (member.isSuspended) return 'Sedang terkena sanksi organisasi'
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

export const ProfileInfo = () => {
  const { member, isEditing, fieldErrors } = useProfileEdit()
  const [selectedGender, setSelectedGender] = useState(member.gender)
  const [isAddressOpen, setIsAddressOpen] = useState(false)
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

  // Provinces only load when address section is opened — not on every edit mode entry
  useEffect(() => {
    if (!isAddressOpen) return
    if (provinces.length > 0) return // already loaded
    let cancelled = false
    setLoadingProvince(true)
    fetchProvincesAction().then((res) => {
      if (cancelled) return
      setLoadingProvince(false)
      if (res.success) setProvinces(res.data ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [isAddressOpen, provinces.length])

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
    return () => {
      cancelled = true
    }
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
    return () => {
      cancelled = true
    }
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
    return () => {
      cancelled = true
    }
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

          <div className='grid grid-cols-2 gap-4'>
            <Field>
              <FieldLabel
                htmlFor='birthPlace'
                className='font-geist-mono text-xs tracking-wide uppercase'
              >
                Tempat Lahir
              </FieldLabel>
              <Input
                id='birthPlace'
                name='birthPlace'
                placeholder='Contoh: Jakarta'
                defaultValue={member.birthPlace ?? ''}
              />
              <FieldError
                errors={fieldErrors?.birthPlace?.map((m) => ({ message: m }))}
              />
            </Field>

            <Field>
              <FieldLabel
                htmlFor='birthDate'
                className='font-geist-mono text-xs tracking-wide uppercase'
              >
                Tanggal Lahir
              </FieldLabel>
              <Input
                id='birthDate'
                name='birthDate'
                type='date'
                defaultValue={member.birthDate ?? ''}
              />
              <FieldError
                errors={fieldErrors?.birthDate?.map((m) => ({ message: m }))}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel className='font-geist-mono text-xs tracking-wide uppercase'>
              Jenis Kelamin
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
              Tahun Masuk KAMMI
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
              placeholder='08123456789 atau +62...'
              defaultValue={member.phone ?? ''}
            />
          </Field>
        </div>

        {/* Alamat — collapsible agar tidak membebani edit data diri */}
        <div className='mt-6'>
          <button
            type='button'
            onClick={() => setIsAddressOpen((v) => !v)}
            className='flex w-full items-center justify-between pb-1'
            aria-expanded={isAddressOpen}
          >
            <div className='mb-1'>
              <h2 className='text-foreground/60 font-geist-mono text-[11px] font-medium tracking-widest uppercase'>
                Alamat
              </h2>
              <Separator className='mt-2' />
            </div>
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              className={cn(
                'text-muted-foreground mb-1 size-3.5 shrink-0 transition-transform duration-200',
                isAddressOpen && 'rotate-180'
              )}
            />
          </button>

          {isAddressOpen && (
            <div className='flex flex-col gap-4 pt-2'>
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
                <input
                  type='hidden'
                  name='addressProvinceCode'
                  value={province}
                />
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
                <input
                  type='hidden'
                  name='addressDistrictCode'
                  value={district}
                />
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
          )}

          {/* Pass existing address values when section is collapsed so they don't get cleared on save */}
          {!isAddressOpen && (
            <>
              <input
                type='hidden'
                name='addressProvince'
                value={member.addressProvince ?? ''}
              />
              <input
                type='hidden'
                name='addressProvinceCode'
                value={member.addressProvinceCode ?? ''}
              />
              <input
                type='hidden'
                name='addressCity'
                value={member.addressCity ?? ''}
              />
              <input
                type='hidden'
                name='addressCityCode'
                value={member.addressCityCode ?? ''}
              />
              <input
                type='hidden'
                name='addressDistrict'
                value={member.addressDistrict ?? ''}
              />
              <input
                type='hidden'
                name='addressDistrictCode'
                value={member.addressDistrictCode ?? ''}
              />
              <input
                type='hidden'
                name='addressSubdistrict'
                value={member.addressSubdistrict ?? ''}
              />
              <input
                type='hidden'
                name='addressSubdistrictCode'
                value={member.addressSubdistrictCode ?? ''}
              />
              <input
                type='hidden'
                name='addressLine'
                value={member.addressLine ?? ''}
              />
            </>
          )}
        </div>
      </section>
    )
  }

  return (
    <section>
      <SectionDivider title='Data Diri' />
      <div className='divide-border/60 divide-y'>
        <InfoRow
          label='Jenis Kelamin'
          value={genderLabel[member.gender] ?? member.gender}
        />
        <InfoRow
          label='Tempat, Tgl Lahir'
          value={
            member.birthPlace || member.birthDate ? (
              <span>
                {[
                  member.birthPlace,
                  member.birthDate
                    ? new Date(member.birthDate).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : null
                ]
                  .filter(Boolean)
                  .join(', ')}
              </span>
            ) : (
              <Placeholder />
            )
          }
        />
        <InfoRow
          label='Tahun Masuk KAMMI'
          value={member.yearOfEntry ?? <Placeholder />}
        />
        <InfoRow
          label='Jenjang'
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
          label='Alamat'
          value={
            addressParts.length > 0 ? (
              <span className='flex flex-col gap-0.5 leading-relaxed'>
                {member.addressLine && <span>{member.addressLine}</span>}
                {[
                  member.addressSubdistrict,
                  member.addressDistrict,
                  member.addressCity,
                  member.addressProvince
                ]
                  .filter(Boolean)
                  .join(', ') || null}
              </span>
            ) : (
              <span className='text-muted-foreground/60 text-sm italic'>
                Belum diisi
              </span>
            )
          }
        />
      </div>
    </section>
  )
}
