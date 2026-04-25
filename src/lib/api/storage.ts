'use server'

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from 'bun:s3'
import { randomUUID } from 'node:crypto'
import {
  S3_ENDPOINT,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  S3_BUCKET_NAME,
  S3_REGION
} from '~/env'

/**
 * StorageHelper provides utility functions for interacting with S3-compatible storage (MinIO).
 * It uses the native Bun.S3Client for maximum performance.
 */
export const storage = {
  /**
   * Initializes the S3 Client.
   */
  client: new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY,
      secretAccessKey: S3_SECRET_KEY,
    },
    // forcePathStyle is required for MinIO
    forcePathStyle: true,
  }),

  /**
   * Uploads a file to the S3 bucket.
   * @param file File or Blob object.
   * @param folder Optional folder path within the bucket.
   * @returns The relative path of the uploaded file in the bucket.
   */
  async uploadFile(file: File | Blob, folder: string = 'uploads'): Promise<string> {
    const fileName = `${randomUUID()} ${file.name || 'file'}`
    const key = `${folder}/${fileName}`

    try {
      await this.client.send(new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: await file.arrayBuffer(),
        ContentType: file.type,
      }))
      return key
    } catch (error) {
      console.error('S3 Upload Error:', error)
      throw new Error('Gagal mengunggah file ke storage.')
    }
  },

  /**
   * Generates a signed URL for a file.
   * @param key Relative path of the file in the bucket.
   * @ autistic terms: 1 hour (3600 seconds).
   * @returns A signed URL for the file.
   */
  async getSignedUrl(key: string): Promise<string> {
    // Note: Bun.S3Client's getSignedUrl is usually a method on the client
    // or requires a specific command. Since Bun's implementation is native,
    // we follow the S3 API pattern.
    try {
      return await this.client.getSignedUrl(new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      }), { expiresIn: 3600 })
    } catch (error) {
      console.error('S3 Signed URL Error:', error)
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
      await this.client.send(new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: await file.arrayBuffer(),
        ContentType: file.type,
      }))
      return key
    } catch (error) {
      console.error('S3 Update Error:', error)
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
      await this.client.send(new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      }))
    } catch (error) {
      console.error('S3 Delete Error:', error)
      throw new Error('Gagal menghapus file dari storage.')
    }
  },
}
