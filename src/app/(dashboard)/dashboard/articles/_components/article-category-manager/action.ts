'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { isArticleOrgInScope } from '~/db/query/article'
import {
  articleCategoryQuery,
  wouldCreateCycle
} from '~/db/query/article-category'
import { getLogger } from '~/lib/logger'
import type { ActionResponse } from '../article-form/types'

const logger = getLogger(['app', 'action', 'article-category'])

export const CategoryInputSchema = z.object({
  // not .uuid(): scope is still enforced via isArticleOrgInScope comparing
  // against the session's real org id; DB column itself remains a strict
  // uuid type
  organizationId: z.string().min(1),
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  slug: z
    .string()
    .min(1, 'Slug wajib diisi')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug hanya boleh huruf kecil, angka, dan tanda hubung'
    ),
  parentId: z.string().uuid().optional()
})

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

export const createCategoryAction = async (
  input: z.infer<typeof CategoryInputSchema>
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

    const created = await articleCategoryQuery.create(validated.data)
    revalidatePath('/dashboard/articles')
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
  input: z.infer<typeof CategoryInputSchema>
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
