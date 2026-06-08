import { S3Client } from 'bun'
import { randomUUID } from 'node:crypto'
import {
  S3_ENDPOINT,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_BUCKET_NAME,
  S3_REGION
} from '~/env'
import { getLogger } from '~/lib/logger'

const logger = getLogger(['app', 'storage'])

/**
 * StorageHelper provides utility functions for interacting with S3-compatible storage (MinIO).
 * It uses Bun's native S3 API for maximum performance and simplicity.
 */
export const storage = {
  /**
   * Initializes the S3 Client using Bun's native implementation.
   */
  client: new S3Client({
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
    bucket: S3_BUCKET_NAME,
    endpoint: S3_ENDPOINT,
    region: S3_REGION
    // forcePathStyle: true, // Remove if not supported by S3Options type
  }),

  /**
   * Uploads a file to the S3 bucket.
   * @param file File or Blob object.
   * @param folder Optional folder path within the bucket.
   * @returns The relative path of the uploaded file in the bucket.
   */
  async uploadFile(
    file: File | Blob,
    folder: string = 'uploads'
  ): Promise<string> {
    const fileName = `${randomUUID()}_${(file as File).name || 'file'}`
    const key = `${folder}/${fileName}`

    try {
      const s3File = this.client.file(key)
      await s3File.write(file, {
        type: file.type
      })
      return key
    } catch (error) {
      logger.error('Gagal mengunggah file ke storage: {error}', { key, error })
      throw new Error('Gagal mengunggah file ke storage.')
    }
  },

  /**
   * Generates a signed URL for a file.
   * @param key Relative path of the file in the bucket.
   * @returns A signed URL for the file.
   */
  async getSignedUrl(key: string): Promise<string> {
    try {
      const s3File = this.client.file(key)
      return s3File.presign({
        expiresIn: 3600 // 1 hour
      })
    } catch (error) {
      logger.error('Gagal membuat URL akses file: {error}', { key, error })
      throw new Error('Gagal membuat URL akses file.')
    }
  },

  /**
   * Updates an existing file in the S3 bucket.
   * @param key Relative path of the file in the bucket.
   * @param file New File or Blob object.
   * @returns The relative path of the updated file.
   */
  async updateFile(key: string, file: File | Blob): Promise<string> {
    try {
      const s3File = this.client.file(key)
      await s3File.write(file, {
        type: file.type
      })
      return key
    } catch (error) {
      logger.error('Gagal memperbarui file di storage: {error}', { key, error })
      throw new Error('Gagal memperbarui file di storage.')
    }
  },

  /**
   * Deletes a file from the S3 bucket.
   * @param key Relative path of the file in the bucket.
   * @returns void.
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const s3File = this.client.file(key)
      await s3File.delete()
    } catch (error) {
      logger.error('Gagal menghapus file dari storage: {error}', { key, error })
      throw new Error('Gagal menghapus file dari storage.')
    }
  }
}
