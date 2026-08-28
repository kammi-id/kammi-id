import { constants } from 'node:fs'
import { access, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { sql } from 'drizzle-orm'
import { db } from '~/db/db'

const uploadsDirectory = () => resolve(process.env.UPLOADS_DIR || './.uploads')

const verifyUploadsDirectory = async () => {
  const directory = uploadsDirectory()
  const [, entry] = await Promise.all([
    access(directory, constants.R_OK | constants.W_OK),
    stat(directory)
  ])

  if (!entry.isDirectory()) throw new Error('Uploads path is not a directory.')
}

export const GET = async () => {
  try {
    await Promise.all([db.execute(sql`SELECT 1`), verifyUploadsDirectory()])
    return Response.json({ status: 'ok' })
  } catch {
    return Response.json({ status: 'unavailable' }, { status: 503 })
  }
}
