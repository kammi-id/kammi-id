import { storage } from '~/lib/api/storage'

/**
 * PNG abu-abu polos 64×64, ikut di-bundle sebagai konstanta — bukan berkas di
 * volume, karena justru volume itulah yang mungkin kosong.
 *
 * Dibuat sekali dengan encoder PNG minimal; tidak ada yang perlu
 * membangkitkannya ulang kecuali warnanya hendak diubah.
 */
const PLACEHOLDER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAT0lEQVR42u3PQQkAAAgEsOvfU3xY' +
    'wgi+hcEKLNXzWgQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE' +
    'Lgs6xXKGx+MAIQAAAABJRU5ErkJggg==',
  'base64'
)

/**
 * Berkas hilang mengembalikan placeholder ber-status 200, bukan 404: `next/image`
 * gagal me-render pada 404, sehingga 404 berarti halaman rusak — persis penyakit
 * yang diobati ADR 0006. Cache-nya sengaja pendek; kalau byte-nya menyusul
 * datang, cache sehari akan menyembunyikannya.
 */
const placeholder = () =>
  new Response(PLACEHOLDER_PNG, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store'
    }
  })

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) => {
  const { key } = await params

  const file = await storage.readFile(key.join('/'))
  if (!file) return placeholder()

  return new Response(file.stream(), {
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=86400'
    }
  })
}
