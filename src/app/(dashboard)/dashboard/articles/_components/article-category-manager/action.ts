'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { isArticleOrgInScope } from '~/db/query/article'
import {
  articleCategoryQuery,
  wouldCreateCycle
} from '~/db/query/article-category'
import { getLogger } from '~/lib/logger'
import type { ActionResponse } from '../article-form/types'
import { CategoryInputSchema, type CategoryInput } from './schema'

const logger = getLogger(['app', 'action', 'article-category'])

const assertCanManageOrg = (
  user: { role: string; connectedOrganization?: { id: string } | null },
  organizationId: string
): string | null => {
  const allowed = isArticleOrgInScope(
    {
      role: user.role,
      connectedOrganizationId: user.connectedOrganization?.id ?? null
    },
    organizationId
  )
  if (!allowed)
    return 'Antum tidak memiliki hak akses untuk mengelola kategori organisasi ini.'
  return null
}

// Defense-in-depth: the client may send any parentId, so verify the parent
// category exists and belongs to the same organization — preventing a humas
// from nesting a category under another organization's category.
const assertParentInOrg = async (
  parentId: string | undefined,
  organizationId: string
): Promise<string | null> => {
  if (!parentId) return null
  const parent = await articleCategoryQuery.getById(parentId)
  if (!parent || parent.organizationId !== organizationId)
    return 'Kategori induk tidak ditemukan di organisasi ini.'
  return null
}

export const createCategoryAction = async (
  input: CategoryInput
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user)
      return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const validated = CategoryInputSchema.safeParse(input)
    if (!validated.success)
      return {
        success: false,
        message: 'Validasi gagal',
        errors: validated.error.flatten().fieldErrors
      }

    const scopeError = assertCanManageOrg(user, validated.data.organizationId)
    if (scopeError) return { success: false, message: scopeError }

    const parentError = await assertParentInOrg(
      validated.data.parentId,
      validated.data.organizationId
    )
    if (parentError)
      return {
        success: false,
        message: parentError,
        errors: { parentId: [parentError] }
      }

    const created = await articleCategoryQuery.create(validated.data)
    revalidatePath('/dashboard/articles')
    updateTag('articles')
    logger.info('Kategori artikel dibuat', {
      actorId: user.id,
      categoryId: created.id
    })

    return { success: true, message: 'Kategori berhasil dibuat', data: created }
  } catch (error) {
    logger.error('Gagal membuat kategori: {error}', { error })
    if (error instanceof Error && error.message.includes('unique constraint'))
      return {
        success: false,
        message: 'Slug kategori sudah dipakai di organisasi ini.',
        errors: { slug: ['Slug kategori sudah dipakai di organisasi ini.'] }
      }
    return {
      success: false,
      message: 'Terjadi kesalahan saat membuat kategori'
    }
  }
}

export const updateCategoryAction = async (
  id: string,
  input: CategoryInput
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user)
      return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const validated = CategoryInputSchema.safeParse(input)
    if (!validated.success)
      return {
        success: false,
        message: 'Validasi gagal',
        errors: validated.error.flatten().fieldErrors
      }

    const existing = await articleCategoryQuery.getById(id)
    if (!existing)
      return { success: false, message: 'Kategori tidak ditemukan.' }

    const scopeError = assertCanManageOrg(user, existing.organizationId)
    if (scopeError) return { success: false, message: scopeError }

    if (validated.data.parentId) {
      const allInOrg = await articleCategoryQuery.listForOrg(
        existing.organizationId
      )
      // Parent must belong to the same organization (it is absent from this
      // org-scoped list otherwise) — blocks cross-org nesting via a crafted
      // request.
      if (!allInOrg.some((category) => category.id === validated.data.parentId))
        return {
          success: false,
          message: 'Kategori induk tidak ditemukan di organisasi ini.',
          errors: {
            parentId: ['Kategori induk tidak ditemukan di organisasi ini.']
          }
        }
      if (wouldCreateCycle(id, validated.data.parentId, allInOrg))
        return {
          success: false,
          message:
            'Kategori induk tidak boleh berupa diri sendiri atau turunannya.',
          errors: {
            parentId: [
              'Kategori induk tidak boleh berupa diri sendiri atau turunannya.'
            ]
          }
        }
    }

    const updated = await articleCategoryQuery.update(id, validated.data)
    revalidatePath('/dashboard/articles')
    updateTag('articles')
    logger.info('Kategori artikel diperbarui', {
      actorId: user.id,
      categoryId: id
    })

    return {
      success: true,
      message: 'Kategori berhasil diperbarui',
      data: updated
    }
  } catch (error) {
    logger.error('Gagal memperbarui kategori: {error}', {
      error,
      categoryId: id
    })
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui kategori'
    }
  }
}

export const deleteCategoryAction = async (
  id: string
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user)
      return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const existing = await articleCategoryQuery.getById(id)
    if (!existing)
      return { success: false, message: 'Kategori tidak ditemukan.' }

    const scopeError = assertCanManageOrg(user, existing.organizationId)
    if (scopeError) return { success: false, message: scopeError }

    await articleCategoryQuery.delete(id)
    revalidatePath('/dashboard/articles')
    updateTag('articles')
    logger.info('Kategori artikel dihapus', {
      actorId: user.id,
      categoryId: id
    })

    return { success: true, message: 'Kategori berhasil dihapus' }
  } catch (error) {
    logger.error('Gagal menghapus kategori: {error}', { error, categoryId: id })
    if (
      error instanceof Error &&
      error.message.includes('foreign key constraint')
    )
      return {
        success: false,
        message: 'Kategori masih dipakai oleh artikel dan tidak dapat dihapus.'
      }
    return {
      success: false,
      message: 'Terjadi kesalahan saat menghapus kategori'
    }
  }
}
