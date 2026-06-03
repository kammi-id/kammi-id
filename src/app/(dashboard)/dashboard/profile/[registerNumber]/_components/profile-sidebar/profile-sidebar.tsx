'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '~/lib/shadcn/utils'
import { RadioGroup, RadioGroupItem } from '~/components/shadcn/ui/radio-group'
import { Field, FieldLabel } from '~/components/shadcn/ui/field'
import { WarningTooltip } from '../warning-tooltip'
import { useProfileEdit } from '../profile-edit-context'
import { RiwayatDaurehSection, RiwayatKeinstrukturanSection } from '../profile-training-history'

interface ProfileSidebarProps {
  orgHierarchySlot?: ReactNode
}

const statusLabel: Record<string, string> = {
  ab1: 'Anggota Biasa I',
  ab2: 'Anggota Biasa II',
  ab3: 'Anggota Biasa III'
}

interface ControlledToggleProps {
  name: string
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

const ControlledToggle = ({
  name,
  label,
  description,
  checked,
  onChange
}: ControlledToggleProps) => (
  <div className='flex items-center justify-between py-2.5'>
    <div>
      <p className='text-foreground text-sm font-medium'>{label}</p>
      {description && (
        <p className='text-muted-foreground text-xs'>{description}</p>
      )}
    </div>
    <button
      type='button'
      role='switch'
      aria-checked={checked ? 'true' : 'false'}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'focus-visible:ring-primary relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        checked ? 'bg-primary' : 'bg-input'
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
    <input type='hidden' name={name} value={checked ? 'true' : 'false'} />
  </div>
)

const Toggle = ({
  name,
  label,
  description,
  defaultChecked
}: {
  name: string
  label: string
  description?: string
  defaultChecked?: boolean
}) => {
  const [checked, setChecked] = useState(defaultChecked ?? false)
  return (
    <ControlledToggle
      name={name}
      label={label}
      description={description}
      checked={checked}
      onChange={setChecked}
    />
  )
}

export const ProfileSidebar = ({ orgHierarchySlot }: ProfileSidebarProps) => {
  const { member, trainingHistory, isEditing } = useProfileEdit()

  const hasCertifications =
    member.isCertifiedMentor || member.isCertifiedInstructor
  const hasSpecialStatus =
    member.isAlumn || member.isSuspended || member.isNonActive

  const hasDpmk =
    trainingHistory?.asAttendant.some((r) => r.type === 'dpmk') ?? false
  const hasTfi =
    trainingHistory?.asAttendant.some((r) => r.type === 'tfi') ?? false

  const [selectedStatus, setSelectedStatus] = useState(member.status)

  // Status keanggotaan — mutual exclusive: hanya satu yang bisa aktif
  type MembershipStatus = 'alumn' | 'nonActive' | 'suspended' | null
  const deriveInitialMembershipStatus = (): MembershipStatus => {
    if (member.isSuspended) return 'suspended'
    if (member.isNonActive) return 'nonActive'
    if (member.isAlumn) return 'alumn'
    return null
  }
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>(
    deriveInitialMembershipStatus
  )

  const toggleMembership = (key: MembershipStatus) => {
    setMembershipStatus((prev) => (prev === key ? null : key))
  }

  if (isEditing) {
    return (
      <aside className='flex flex-col gap-6'>
        <div>
          <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium tracking-widest uppercase'>
            Status Kaderisasi
          </h2>
          <Field>
            <RadioGroup
              name='status'
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              className='flex flex-col gap-2'
            >
              {(['ab1', 'ab2', 'ab3'] as const).map((val) => (
                <label
                  key={val}
                  htmlFor={`status-${val}`}
                  className={cn(
                    'flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-colors',
                    selectedStatus === val
                      ? 'border-primary bg-primary/8'
                      : 'border-border hover:border-primary/40'
                  )}
                >
                  <div>
                    <p
                      className={cn(
                        'font-geist-mono text-xs font-semibold uppercase',
                        selectedStatus === val
                          ? 'text-primary'
                          : 'text-foreground'
                      )}
                    >
                      {val.toUpperCase()}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {statusLabel[val]}
                    </p>
                  </div>
                  <RadioGroupItem
                    value={val}
                    id={`status-${val}`}
                    className='sr-only'
                  />
                </label>
              ))}
            </RadioGroup>
          </Field>
        </div>

        <div>
          <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium tracking-widest uppercase'>
            Status Keanggotaan
          </h2>
          <p className='text-muted-foreground mb-2 text-xs'>Hanya satu yang dapat aktif sekaligus.</p>
          <div className='divide-border/60 divide-y rounded-lg border px-3'>
            <ControlledToggle
              name='isAlumn'
              label='Alumni'
              description='Tandai sebagai alumni KAMMI'
              checked={membershipStatus === 'alumn'}
              onChange={() => toggleMembership('alumn')}
            />
            <ControlledToggle
              name='isNonActive'
              label='Non-Aktif'
              description='Tidak aktif berorganisasi'
              checked={membershipStatus === 'nonActive'}
              onChange={() => toggleMembership('nonActive')}
            />
            <ControlledToggle
              name='isSuspended'
              label='Dipecat/Diskorsing'
              description='Keanggotaan ditangguhkan'
              checked={membershipStatus === 'suspended'}
              onChange={() => toggleMembership('suspended')}
            />
          </div>
        </div>

        <div>
          <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium tracking-widest uppercase'>
            Sertifikasi
          </h2>
          <div className='divide-border/60 divide-y rounded-lg border px-3'>
            <Toggle
              name='isCertifiedMentor'
              label='Pemandu Tersertifikasi'
              description='Lulus DM dan bersertifikat pemandu'
              defaultChecked={member.isCertifiedMentor}
            />
            <Toggle
              name='isCertifiedInstructor'
              label='Instruktur Tersertifikasi'
              description='Lulus TFI dan bersertifikat instruktur'
              defaultChecked={member.isCertifiedInstructor}
            />
          </div>
        </div>

        {orgHierarchySlot}
      </aside>
    )
  }

  return (
    <aside className='flex flex-col gap-6'>
      <div>
        <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium tracking-widest uppercase'>
          Sertifikasi
        </h2>
        {hasCertifications ? (
          <div className='flex flex-col gap-2'>
            {member.isCertifiedMentor && (
              <div className='border-border rounded-lg border px-3 py-2.5'>
                <p className='text-foreground text-sm font-semibold'>Pemandu</p>
                <div className='mt-0.5 flex items-center gap-1.5'>
                  <p className='text-muted-foreground text-xs'>
                    Telah mengikuti DPMK
                  </p>
                  {!hasDpmk && (
                    <WarningTooltip message='Belum ada entry DPMK di riwayat dauroh' />
                  )}
                </div>
              </div>
            )}
            {member.isCertifiedInstructor && (
              <div className='border-border rounded-lg border px-3 py-2.5'>
                <p className='text-foreground text-sm font-semibold'>
                  Instruktur
                </p>
                <div className='mt-0.5 flex items-center gap-1.5'>
                  <p className='text-muted-foreground text-xs'>
                    Telah mengikuti TFI
                  </p>
                  {!hasTfi && (
                    <WarningTooltip message='Belum ada entry TFI di riwayat dauroh' />
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className='text-muted-foreground text-sm'>
              Belum ada sertifikasi.
            </p>
            <p className='text-muted-foreground/60 mt-1 text-xs'>
              Diperoleh setelah lulus DM atau TFI.
            </p>
          </div>
        )}
      </div>

      {orgHierarchySlot}

      <RiwayatDaurehSection />
      <RiwayatKeinstrukturanSection />

      {hasSpecialStatus && (
        <div>
          <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium tracking-widest uppercase'>
            Status Khusus
          </h2>
          <div className='flex flex-col gap-2'>
            {member.isSuspended && (
              <div className='rounded-lg border [border-color:var(--status-suspended-border)] [background-color:var(--status-suspended-bg)] px-3 py-2.5'>
                <p className='text-sm font-semibold [color:var(--status-suspended-text)]'>
                  Dipecat / Diskorsing
                </p>
                <p className='text-xs [color:var(--status-suspended-subtext)]'>
                  Keanggotaan ditangguhkan
                </p>
              </div>
            )}
            {member.isNonActive && !member.isSuspended && (
              <div className='rounded-lg border [border-color:var(--status-nonactive-border)] [background-color:var(--status-nonactive-bg)] px-3 py-2.5'>
                <p className='text-sm font-semibold [color:var(--status-nonactive-text)]'>
                  Non-Aktif
                </p>
                <p className='text-xs [color:var(--status-nonactive-subtext)]'>
                  Tidak aktif berorganisasi
                </p>
              </div>
            )}
            {member.isAlumn && (
              <div className='rounded-lg border [border-color:var(--status-alumn-border)] [background-color:var(--status-alumn-bg)] px-3 py-2.5'>
                <p className='text-sm font-semibold [color:var(--status-alumn-text)]'>
                  Alumni
                </p>
                <p className='text-xs [color:var(--status-alumn-subtext)]'>
                  Telah menyelesaikan kaderisasi
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
