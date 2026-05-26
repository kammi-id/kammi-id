import { HugeiconsIcon } from '@hugeicons/react'
import { Tick01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import type {
  MemberTrainingHistory,
  TrainingType,
  InstructorRole
} from '~/db/query/training'
import { Separator } from '~/components/shadcn/ui/separator'

interface ProfileTrainingHistoryProps {
  history: MemberTrainingHistory
}

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
  assistant_master: 'Assistant Master of Training',
  administrator: 'Admin Dauroh',
  classroom_master: 'Master of Classroom',
  lecturer: 'Instruktur Materi',
  observer: 'Observer',
  ustadz_of_training: 'Ustadz Dauroh'
}

const SectionDivider = ({ title }: { title: string }) => (
  <div className='mt-6 mb-1 first:mt-0'>
    <h2 className='text-foreground/60 font-geist-mono text-[11px] font-medium tracking-widest uppercase'>
      {title}
    </h2>
    <Separator className='mt-2' />
  </div>
)

const EmptyState = ({ text }: { text: string }) => (
  <p className='text-muted-foreground py-4 text-sm'>{text}</p>
)

export const ProfileTrainingHistory = ({
  history
}: ProfileTrainingHistoryProps) => {
  return (
    <section>
      <SectionDivider title='Riwayat Dauroh' />

      <div className='mt-1 mb-3 flex items-center gap-2'>
        <span className='font-geist-mono text-muted-foreground text-xs tracking-wide uppercase'>
          Sebagai Peserta
        </span>
        {history.asAttendant.length > 0 && (
          <span className='font-geist-mono text-muted-foreground/60 text-xs'>
            ({history.asAttendant.length})
          </span>
        )}
      </div>

      {history.asAttendant.length === 0 ? (
        <EmptyState text='Belum ada riwayat dauroh sebagai peserta.' />
      ) : (
        <div
          className='border-border overflow-x-auto rounded-lg border'
          role='region'
          aria-label='Riwayat dauroh sebagai peserta'
        >
          <table className='w-full min-w-[480px] text-sm'>
            <thead>
              <tr className='border-border border-b'>
                <th
                  scope='col'
                  className='text-muted-foreground font-geist-mono px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'
                >
                  Dauroh
                </th>
                <th
                  scope='col'
                  className='text-muted-foreground font-geist-mono px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'
                >
                  Tipe
                </th>
                <th
                  scope='col'
                  className='text-muted-foreground font-geist-mono px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'
                >
                  Tahun
                </th>
                <th
                  scope='col'
                  className='text-muted-foreground font-geist-mono px-4 py-2.5 text-center text-xs font-medium tracking-wide uppercase'
                >
                  Lulus
                </th>
              </tr>
            </thead>
            <tbody className='divide-border/60 divide-y'>
              {history.asAttendant.map((record) => (
                <tr
                  key={record.id}
                  className='hover:bg-muted/30 transition-colors'
                >
                  <td className='text-foreground px-4 py-3 font-medium'>
                    {record.name}
                    {record.organizationName && (
                      <span className='text-muted-foreground ml-1.5 text-xs font-normal'>
                        &middot; {record.organizationName}
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    <span className='font-geist-mono text-muted-foreground text-xs'>
                      {trainingTypeLabel[record.type]}
                    </span>
                  </td>
                  <td className='text-muted-foreground px-4 py-3 text-sm'>
                    {record.year}
                  </td>
                  <td className='px-4 py-3 text-center'>
                    <span className='inline-flex items-center justify-center'>
                      {record.isPassing ? (
                        <>
                          <HugeiconsIcon
                            icon={Tick01Icon}
                            aria-hidden='true'
                            className='size-4 text-[var(--status-training-pass)]'
                          />
                          <span className='sr-only'>Lulus</span>
                        </>
                      ) : (
                        <>
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            aria-hidden='true'
                            className='size-4 text-[var(--status-training-fail)]'
                          />
                          <span className='sr-only'>Tidak Lulus</span>
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className='mt-6 mb-3 flex items-center gap-2'>
        <span className='font-geist-mono text-muted-foreground text-xs tracking-wide uppercase'>
          Sebagai Instruktur
        </span>
        {history.asInstructor.length > 0 && (
          <span className='font-geist-mono text-muted-foreground/60 text-xs'>
            ({history.asInstructor.length})
          </span>
        )}
      </div>

      {history.asInstructor.length === 0 ? (
        <EmptyState text='Belum ada riwayat dauroh sebagai instruktur.' />
      ) : (
        <div
          className='border-border overflow-x-auto rounded-lg border'
          role='region'
          aria-label='Riwayat dauroh sebagai instruktur'
        >
          <table className='w-full min-w-[480px] text-sm'>
            <thead>
              <tr className='border-border border-b'>
                <th
                  scope='col'
                  className='text-muted-foreground font-geist-mono px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'
                >
                  Dauroh
                </th>
                <th
                  scope='col'
                  className='text-muted-foreground font-geist-mono px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'
                >
                  Tipe
                </th>
                <th
                  scope='col'
                  className='text-muted-foreground font-geist-mono px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'
                >
                  Tahun
                </th>
                <th
                  scope='col'
                  className='text-muted-foreground font-geist-mono px-4 py-2.5 text-left text-xs font-medium tracking-wide uppercase'
                >
                  Peran
                </th>
              </tr>
            </thead>
            <tbody className='divide-border/60 divide-y'>
              {history.asInstructor.map((record) => (
                <tr
                  key={`${record.id}-instructor`}
                  className='hover:bg-muted/30 transition-colors'
                >
                  <td className='text-foreground px-4 py-3 font-medium'>
                    {record.name}
                    {record.organizationName && (
                      <span className='text-muted-foreground ml-1.5 text-xs font-normal'>
                        &middot; {record.organizationName}
                      </span>
                    )}
                  </td>
                  <td className='px-4 py-3'>
                    <span className='font-geist-mono text-muted-foreground text-xs'>
                      {trainingTypeLabel[record.type]}
                    </span>
                  </td>
                  <td className='text-muted-foreground px-4 py-3 text-sm'>
                    {record.year}
                  </td>
                  <td className='text-foreground/80 px-4 py-3 text-sm'>
                    {instructorRoleLabel[record.role] ?? record.role}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
