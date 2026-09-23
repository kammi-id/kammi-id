'use server'

import { storage } from '~/lib/api/storage'
import { fetchRemoteImage } from '~/lib/api/remote-image'
import { readActiveSession } from '~/lib/auth/cookies'
import { MAX_UPLOAD_BYTES } from '~/lib/api/upload-constraints'
import { getLogger } from '~/lib/logger'

const logger = getLogger(['app', 'storage'])

// Klien memeriksa batas ini juga (lihat `upload-constraints.ts`), tapi
// `bodySizeLimit` tetap 50mb — jadi ini yang mengikat, pemeriksaan di klien
// sekadar kenyamanan.

/**
 * Uploads an image to storage.
 * If existingPath is provided, it updates the existing file.
 * Otherwise, it uploads a new file to the specified folder.
 */
export const uploadImageAction = async (formData: FormData) => {
  const file = formData.get('file') as File | null
  const existingPath = formData.get('existingPath') as string | null
  const folder = (formData.get('folder') as string) || 'uploads'

  if (!file) {
    throw new Error('File is required.')
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Ukuran file ${(file.size / 1024 / 1024).toFixed(1)}MB melebihi batas 5MB.`
    )
  }

  if (existingPath) {
    return await storage.updateFile(existingPath, file)
  }

  return await storage.uploadFile(file, folder)
}

/**
 * Menyalin gambar dari alamat publik ke penyimpanan sendiri, lalu
 * mengembalikan kuncinya — bentuk yang sama dengan `uploadImageAction`.
 *
 * Dipakai saat menempel dari Google Docs/halaman web, yang membawa gambarnya
 * sebagai URL milik orang lain. Tanpa ini gambarnya memang tampil, tapi kita
 * cuma menumpang di server sumber: begitu tautannya mati atau aksesnya
 * dicabut, Berita yang sudah terbit ikut kehilangan gambarnya.
 *
 * Satu-satunya Server Action di berkas ini yang MEMBUAT server menghubungi
 * alamat pilihan pemanggil, jadi satu-satunya yang menuntut sesi aktif:
 * tanpa itu ia jadi pemindai jaringan dalam yang terbuka untuk siapa saja.
 * Pagar alamatnya sendiri ada di `~/lib/api/remote-image`.
 */
export const importImageFromUrlAction = async (
  url: string,
  folder: string = 'uploads'
) => {
  const session = await readActiveSession()
  if (!session?.user) throw new Error('Tidak terautentikasi.')

  const file = await fetchRemoteImage(url)
  return await storage.uploadFile(file, folder)
}

/**
 * Gets a signed URL for a file.
 */
export const getSignedUrlAction = async (path: string) => {
  return `/api/images/${path}`
}

/**
 * Deletes an image from storage.
 * @param path The path of the image to delete.
 */
export const deleteImageAction = async (path: string) => {
  try {
    await storage.deleteFile(path)
    return { success: true }
  } catch (error) {
    logger.error('Gagal menghapus gambar: {error}', { path, error })
    return { success: false, error: (error as Error).message }
  }
}
