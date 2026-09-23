import { redirect } from 'next/navigation'
import {
  readVerificationAudit,
  readVerificationKeys
} from '~/db/query/verification-key'
import { requireVerificationKeyManageAccess } from '~/lib/auth/verification-key'
import { VerificationKeyManager } from './_components/verification-key-manager'

const VerificationKaderPage = async () => {
  if (!(await requireVerificationKeyManageAccess())) redirect('/dashboard')

  const [keys, audit] = await Promise.all([
    readVerificationKeys(),
    readVerificationAudit()
  ])

  return (
    <div className='space-y-8 px-4 py-4 md:py-6 lg:px-6'>
      <div>
        <h1 className='font-heading text-3xl font-bold tracking-tight'>
          Verifikasi Kader Eksternal
        </h1>
        <p className='text-muted-foreground mt-2 text-sm'>
          API hanya mengembalikan Kader Aktif dan Alumni dari Nomor Induk
          Anggota.
        </p>
      </div>
      <VerificationKeyManager keys={keys} />
      <section className='space-y-3 rounded-lg border p-4'>
        <h2 className='font-semibold'>Audit 90 hari terakhir</h2>
        <ul className='divide-y'>
          {audit.map((entry, index) => (
            <li
              className='py-2 text-sm'
              key={`${entry.occurredAt.toISOString()}-${index}`}
            >
              {entry.occurredAt.toLocaleString('id-ID')} · {entry.outcome}
              {entry.reason ? ` (${entry.reason})` : ''}
            </li>
          ))}
          {audit.length === 0 && (
            <li className='text-muted-foreground py-2 text-sm'>
              Belum ada akses.
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}

export default VerificationKaderPage
