'use client'

import React, { useState } from 'react'
import { cn } from '~/lib/shadcn/utils'
import { RadioGroup, RadioGroupItem } from '~/components/shadcn/ui/radio-group'
import { Field, FieldLabel } from '~/components/shadcn/ui/field'
import { WarningTooltip } from '../warning-tooltip'
import type { Member } from '~/db/query/member'
import type { MemberTrainingHistory } from '~/db/query/training'

interface ProfileSidebarProps {
  member: Member
  trainingHistory?: MemberTrainingHistory
  isEditing?: boolean
  orgHierarchySlot?: React.ReactNode
}

const statusLabel: Record<string, string> = {
  ab1: 'Anggota Biasa I',
  ab2: 'Anggota Biasa II',
  ab3: 'Anggota Biasa III'
}

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
        aria-checked={checked}
        aria-label={label}
        onClick={() => setChecked(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.52_0.20_17)] focus-visible:ring-offset-2',
          checked
            ? 'bg-[oklch(0.52_0.20_17)]'
            : 'bg-[oklch(0.85_0.004_286)]'
        )}
      >
        <span
          className={cn(
            'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
      <input type='hidden' name={name} value={checked ? 'true' : 'false'} />
    </div>
  )
}

export const ProfileSidebar = ({
  member,
  trainingHistory,
  isEditing = false,
  orgHierarchySlot
}: ProfileSidebarProps) => {
  const hasCertifications = member.isCertifiedMentor || member.isCertifiedInstructor
  const hasSpecialStatus = member.isAlumn || member.isSuspended || member.isNonActive

  const hasDpmk = trainingHistory?.asAttendant.some((r) => r.type === 'dpmk') ?? false
  const hasTfi = trainingHistory?.asAttendant.some((r) => r.type === 'tfi') ?? false

  const [selectedStatus, setSelectedStatus] = useState(member.status)

  if (isEditing) {
    return (
      <aside className='flex flex-col gap-6'>
        <div>
          <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium uppercase tracking-widest'>
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
                      ? 'border-[oklch(0.52_0.20_17)] bg-[oklch(0.52_0.20_17/0.08)]'
                      : 'border-border hover:border-[oklch(0.52_0.20_17/0.40)]'
                  )}
                >
                  <div>
                    <p className={cn(
                      'font-geist-mono text-xs font-semibold uppercase',
                      selectedStatus === val ? 'text-[oklch(0.42_0.18_17)]' : 'text-foreground'
                    )}>
                      {val.toUpperCase()}
                    </p>
                    <p className='text-muted-foreground text-xs'>{statusLabel[val]}</p>
                  </div>
                  <RadioGroupItem value={val} id={`status-${val}`} className='sr-only' />
                </label>
              ))}
            </RadioGroup>
          </Field>
        </div>

        <div>
          <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium uppercase tracking-widest'>
            Status Keanggotaan
          </h2>
          <div className='divide-border/60 divide-y rounded-lg border px-3'>
            <Toggle
              name='isAlumn'
              label='Alumni'
              description='Tandai sebagai alumni KAMMI'
              defaultChecked={member.isAlumn}
            />
            <Toggle
              name='isNonActive'
              label='Non-Aktif'
              description='Tidak aktif berorganisasi'
              defaultChecked={member.isNonActive}
            />
            <Toggle
              name='isSuspended'
              label='Dipecat/Diskorsing'
              description='Keanggotaan ditangguhkan'
              defaultChecked={member.isSuspended}
            />
          </div>
        </div>

        <div>
          <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium uppercase tracking-widest'>
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
        <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium uppercase tracking-widest'>
          Sertifikasi
        </h2>
        {hasCertifications ? (
          <div className='flex flex-col gap-2'>
            {member.isCertifiedMentor && (
              <div className='border-border rounded-lg border px-3 py-2.5'>
                <p className='text-foreground text-sm font-semibold'>Pemandu</p>
                <div className='mt-0.5 flex items-center gap-1.5'>
                  <p className='text-muted-foreground text-xs'>Telah mengikuti DPMK</p>
                  {!hasDpmk && (
                    <WarningTooltip message='Belum ada entry DPMK di riwayat dauroh' />
                  )}
                </div>
              </div>
            )}
            {member.isCertifiedInstructor && (
              <div className='border-border rounded-lg border px-3 py-2.5'>
                <p className='text-foreground text-sm font-semibold'>Instruktur</p>
                <div className='mt-0.5 flex items-center gap-1.5'>
                  <p className='text-muted-foreground text-xs'>Telah mengikuti TFI</p>
                  {!hasTfi && (
                    <WarningTooltip message='Belum ada entry TFI di riwayat dauroh' />
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className='text-muted-foreground text-sm'>Belum ada sertifikasi.</p>
            <p className='text-muted-foreground/60 mt-1 text-xs'>Diperoleh setelah lulus DM atau TFI.</p>
          </div>
        )}
      </div>

      {orgHierarchySlot}

      {hasSpecialStatus && (
        <div>
          <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium uppercase tracking-widest'>
            Status Khusus
          </h2>
          <div className='flex flex-col gap-2'>
            {member.isSuspended && (
              <div className='rounded-lg border border-[oklch(0.52_0.20_17/0.25)] bg-[oklch(0.58_0.20_17/0.08)] px-3 py-2.5'>
                <p className='text-[oklch(0.42_0.18_17)] text-sm font-semibold'>Dipecat / Diskorsing</p>
                <p className='text-[oklch(0.52_0.14_17)] text-xs'>Keanggotaan ditangguhkan</p>
              </div>
            )}
            {member.isNonActive && !member.isSuspended && (
              <div className='rounded-lg border border-[oklch(0.55_0.01_285/0.25)] bg-[oklch(0.55_0.01_285/0.08)] px-3 py-2.5'>
                <p className='text-[oklch(0.35_0.008_285)] text-sm font-semibold'>Non-Aktif</p>
                <p className='text-[oklch(0.50_0.008_285)] text-xs'>Tidak aktif berorganisasi</p>
              </div>
            )}
            {member.isAlumn && (
              <div className='rounded-lg border border-[oklch(0.42_0.17_265/0.25)] bg-[oklch(0.55_0.18_265/0.08)] px-3 py-2.5'>
                <p className='text-[oklch(0.38_0.17_265)] text-sm font-semibold'>Alumni</p>
                <p className='text-[oklch(0.48_0.14_265)] text-xs'>Telah menyelesaikan kaderisasi</p>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}
