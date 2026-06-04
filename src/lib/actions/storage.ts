'use server'

import { storage } from '~/lib/api/storage'

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

  if (existingPath) {
    return await storage.updateFile(existingPath, file)
  }

  return await storage.uploadFile(file, folder)
}

/**
 * Gets a signed URL for a file.
 */
export const getSignedUrlAction = async (path: string) => {
  try {
    return await storage.getSignedUrl(path)
  } catch (error) {
    console.error('getSignedUrlAction Error:', error)
    throw new Error('Gagal mengambil URL gambar.')
  }
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
    console.error('deleteImageAction Error:', error)
    return { success: false, error: (error as Error).message }
  }
}
