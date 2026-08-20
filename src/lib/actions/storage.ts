'use server'

import { storage } from '~/lib/api/storage'
import { getLogger } from '~/lib/logger'

const logger = getLogger(['app', 'storage'])

// `image-upload.tsx` menjanjikan "Maks. 5MB" di UI, tapi janji itu tidak
// pernah ditegakkan di server — `bodySizeLimit` tetap 50mb. Batas ini yang
// mengikat; pemeriksaan di klien sekadar kenyamanan.
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

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
    throw new Error('Ukuran file melebihi batas 5MB.')
  }

  if (existingPath) {
    return await storage.updateFile(existingPath, file)
  }

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
