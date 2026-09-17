import { revalidateTag } from 'next/cache'

/**
 * Dipanggil dari luar proses Next.js (mis. wizard staging refresh) setelah
 * mutasi data yang melewati aplikasi, seperti `pg_restore` langsung ke
 * Postgres — mutasi begitu tidak pernah lewat `updateTag` di Server Action
 * mana pun, jadi cache `'use cache'` untuk site-settings bisa nyangkut di
 * data lama sampai `cacheLife` habis. `revalidateTag` dipilih atas `updateTag`
 * karena yang terakhir hanya bisa dipanggil dari Server Action, bukan Route
 * Handler (lihat docs Next.js — proyek ini pakai fork kustom).
 */
export const POST = async (req: Request) => {
  const secret = req.headers.get('x-revalidate-secret')
  const expected = process.env.CACHE_REVALIDATE_SECRET

  if (!expected || secret !== expected) {
    return new Response('Unauthorized', { status: 401 })
  }

  revalidateTag('site-settings', 'max')
  return new Response('OK', { status: 200 })
}
