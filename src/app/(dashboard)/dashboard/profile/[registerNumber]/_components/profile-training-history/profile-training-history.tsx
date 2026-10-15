'use client'

import { HugeiconsIcon } from '@hugeicons/react'
import { Tick01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import type { TrainingType, InstructorRole } from '~/db/query/training'
import { useProfileEdit } from '../profile-edit-context'

const trainingTypeLabel: Record<TrainingType, string> = {
  dm1: 'DM 1',
  dm2: 'DM 2',
  dm3: 'DM 3',
  dpmk: 'DPMK',
  tfi: 'TFI',
  other: 'Lainnya'
}

const instructorRoleLabel: Record<InstructorRole, string> = {
  master: 'Master of Training',
  assistant_master: 'Asst. Master',
  administrator: 'Admin Daurah',
  classroom_master: 'Master of Classroom',
  lecturer: 'Instruktur Materi',
  observer: 'Observer',
  ustadz_of_training: 'Ustadz Daurah'
}

export const RiwayatDaurehSection = () => {
  const { trainingHistory: history } = useProfileEdit()

  return (
    <div>
      <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium tracking-widest uppercase'>
        Riwayat Daurah
        {history.asAttendant.length > 0 && (
          <span className='ml-1.5 font-normal opacity-60'>
            ({history.asAttendant.length})
          </span>
        )}
      </h2>

      {history.asAttendant.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          Belum ada riwayat daurah.
        </p>
      ) : (
        <div className='divide-border/60 divide-y'>
          {history.asAttendant.map((record) => (
            <div
              key={record.id}
              className='flex items-start justify-between gap-2 py-2.5'
            >
              <div className='min-w-0 flex-1'>
                <p className='text-foreground truncate text-sm font-medium'>
                  {record.name}
                </p>
                {record.organizationName && (
                  <p className='text-muted-foreground truncate text-xs'>
                    {record.organizationName}
                  </p>
                )}
              </div>
              <div className='flex shrink-0 items-center gap-1.5'>
                <span className='font-geist-mono text-muted-foreground text-xs'>
                  {trainingTypeLabel[record.type]}
                </span>
                <span className='text-muted-foreground text-xs'>
                  {record.year}
                </span>
                {record.isPassing ? (
                  <HugeiconsIcon
                    icon={Tick01Icon}
                    aria-label='Lulus'
                    className='size-3.5 shrink-0 text-[var(--status-training-pass)]'
                  />
                ) : (
                  <HugeiconsIcon
                    icon={Cancel01Icon}
                    aria-label='Tidak Lulus'
                    className='size-3.5 shrink-0 text-[var(--status-training-fail)]'
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const RiwayatKeinstrukturanSection = () => {
  const { trainingHistory: history } = useProfileEdit()

  return (
    <div>
      <h2 className='text-muted-foreground font-geist-mono mb-3 text-[11px] font-medium tracking-widest uppercase'>
        Riwayat Keinstrukturan
        {history.asInstructor.length > 0 && (
          <span className='ml-1.5 font-normal opacity-60'>
            ({history.asInstructor.length})
          </span>
        )}
      </h2>

      {history.asInstructor.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          Belum ada riwayat keinstrukturan.
        </p>
      ) : (
        <div className='divide-border/60 divide-y'>
          {history.asInstructor.map((record) => (
            <div key={`${record.id}-instructor`} className='py-2.5'>
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0 flex-1'>
                  <p className='text-foreground truncate text-sm font-medium'>
                    {record.name}
                  </p>
                  {record.organizationName && (
                    <p className='text-muted-foreground truncate text-xs'>
                      {record.organizationName}
                    </p>
                  )}
                </div>
                <div className='shrink-0 text-right'>
                  <p className='font-geist-mono text-muted-foreground text-xs'>
                    {trainingTypeLabel[record.type]} · {record.year}
                  </p>
                </div>
              </div>
              <p className='text-muted-foreground mt-0.5 text-xs'>
                {instructorRoleLabel[record.role] ?? record.role}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
