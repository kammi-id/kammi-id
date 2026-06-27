'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { articleQuery, isArticleOrgInScope } from '~/db/query/article'
import { getLogger } from '~/lib/logger'
import type { ActionResponse } from '../article-form/types'

const logger = getLogger(['app', 'action', 'article'])

export const deleteArticleAction = async (
  id: string,
  confirmInput: string
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user)
      return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const existing = await articleQuery.getById(id)
    if (!existing)
      return { success: false, message: 'Artikel tidak ditemukan.' }

    const allowed = isArticleOrgInScope(
      {
        role: user.role,
        connectedOrganizationId: user.connectedOrganization?.id ?? null
      },
      existing.organizationId
    )
    if (!allowed)
      return {
        success: false,
        message: 'Antum tidak memiliki hak akses untuk mengelola artikel ini.'
      }

    if (confirmInput !== existing.title)
      return {
        success: false,
        message: 'Judul artikel yang dimasukkan tidak sesuai'
      }

    await articleQuery.delete(id)
    revalidatePath('/dashboard/articles')
    updateTag('articles')

    logger.info('Artikel dihapus', { actorId: user.id, articleId: id })

    return { success: true, message: 'Artikel berhasil dihapus' }
  } catch (error) {
    logger.error('Gagal menghapus artikel: {error}', { error, articleId: id })
    return {
      success: false,
      message: 'Terjadi kesalahan saat menghapus artikel'
    }
  }
}
