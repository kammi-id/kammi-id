'use client'

import { useActionState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createVerificationKeyAction,
  revokeVerificationKeyAction,
  type CreateVerificationKeyState
} from './action'

type Key = {
  id: string
  createdAt: Date
  lastUsedAt: Date | null
  revokedAt: Date | null
}

const initialState: CreateVerificationKeyState = {}

export const VerificationKeyManager = ({ keys }: { keys: Key[] }) => {
  const [state, createAction, isCreating] = useActionState(
    createVerificationKeyAction,
    initialState
  )
  const [isRevoking, startTransition] = useTransition()
  const router = useRouter()

  const revoke = (id: string) => {
    startTransition(async () => {
      await revokeVerificationKeyAction(id)
      router.refresh()
    })
  }

  return (
    <section className='space-y-4 rounded-lg border p-4'>
      <div>
        <h2 className='font-semibold'>Kunci Verifikasi</h2>
        <p className='text-muted-foreground text-sm'>
          Secret hanya ditampilkan sekali. Bagikan hanya kepada pihak yang
          berwenang memverifikasi Kader.
        </p>
      </div>
      <form action={createAction}>
        <button
          className='bg-primary text-primary-foreground rounded px-3 py-2 disabled:opacity-50'
          disabled={isCreating}
        >
          {isCreating ? 'Membuat…' : 'Buat kunci baru'}
        </button>
      </form>
      {state.error && <p role='alert'>{state.error}</p>}
      {state.secret && (
        <div className='rounded border border-amber-500 p-3' role='status'>
          <p className='font-medium'>
            Simpan secret ini sekarang. Ia tidak akan ditampilkan lagi.
          </p>
          <code className='mt-2 block break-all'>{state.secret}</code>
        </div>
      )}
      <ul className='divide-y rounded border'>
        {keys.map((key) => (
          <li
            className='flex items-center justify-between gap-3 p-3'
            key={key.id}
          >
            <span className='text-sm'>
              Dibuat {key.createdAt.toLocaleString('id-ID')}
              {key.lastUsedAt
                ? ` · terakhir dipakai ${key.lastUsedAt.toLocaleString('id-ID')}`
                : ''}
            </span>
            {key.revokedAt ? (
              <span className='text-muted-foreground text-sm'>Dicabut</span>
            ) : (
              <button
                className='rounded border px-2 py-1 text-sm disabled:opacity-50'
                disabled={isRevoking}
                onClick={() => revoke(key.id)}
                type='button'
              >
                Cabut
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
