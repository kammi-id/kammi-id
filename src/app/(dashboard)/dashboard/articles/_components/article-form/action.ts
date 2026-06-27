'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { articleQuery, isArticleOrgInScope } from '~/db/query/article'
import { articleCategoryQuery } from '~/db/query/article-category'
import { getLogger, redact } from '~/lib/logger'
import type { ActionResponse } from './types'
import { ArticleInputSchema, type ArticleInput } from './schema'

const logger = getLogger(['app', 'action', 'article'])

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
    return 'Antum tidak memiliki hak akses untuk mengelola artikel organisasi ini.'
  return null
}

// Defense-in-depth: the client may send any categoryId, so verify it exists and
// belongs to the same organization as the article — preventing a humas from
// attaching another organization's category via a crafted request.
const assertCategoryInOrg = async (
  categoryId: string | undefined,
  organizationId: string
): Promise<string | null> => {
  if (!categoryId) return null
  const category = await articleCategoryQuery.getById(categoryId)
  if (!category || category.organizationId !== organizationId)
    return 'Kategori tidak ditemukan di organisasi ini.'
  return null
}

export const createArticleAction = async (
  input: ArticleInput
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user)
      return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const validated = ArticleInputSchema.safeParse(input)
    if (!validated.success)
      return {
        success: false,
        message: 'Validasi gagal',
        errors: validated.error.flatten().fieldErrors
      }

    const scopeError = assertCanManageOrg(user, validated.data.organizationId)
    if (scopeError) return { success: false, message: scopeError }

    const categoryError = await assertCategoryInOrg(
      validated.data.categoryId,
      validated.data.organizationId
    )
    if (categoryError)
      return {
        success: false,
        message: categoryError,
        errors: { categoryId: [categoryError] }
      }

    const created = await articleQuery.create({
      ...validated.data,
      publishedAt: validated.data.publishedAt
        ? new Date(validated.data.publishedAt)
        : null
    })

    revalidatePath('/dashboard/articles')
    updateTag('articles')
    logger.info('Artikel dibuat', { actorId: user.id, articleId: created.id })

    return { success: true, message: 'Artikel berhasil dibuat', data: created }
  } catch (error) {
    logger.error('Gagal membuat artikel: {error}', {
      error,
      input: redact(input as Record<string, unknown>)
    })
    if (error instanceof Error && error.message.includes('unique constraint'))
      return {
        success: false,
        message: 'Permalink sudah dipakai di organisasi ini.',
        errors: { slug: ['Permalink sudah dipakai di organisasi ini.'] }
      }
    return { success: false, message: 'Terjadi kesalahan saat membuat artikel' }
  }
}

export const updateArticleAction = async (
  id: string,
  input: ArticleInput
): Promise<ActionResponse> => {
  try {
    const session = await readActiveSession()
    if (!session?.user)
      return { success: false, message: 'Tidak terautentikasi' }
    const { user } = session

    const validated = ArticleInputSchema.safeParse(input)
    if (!validated.success)
      return {
        success: false,
        message: 'Validasi gagal',
        errors: validated.error.flatten().fieldErrors
      }

    const existing = await articleQuery.getById(id)
    if (!existing)
      return { success: false, message: 'Artikel tidak ditemukan.' }

    const scopeError = assertCanManageOrg(user, existing.organizationId)
    if (scopeError) return { success: false, message: scopeError }

    const categoryError = await assertCategoryInOrg(
      validated.data.categoryId,
      existing.organizationId
    )
    if (categoryError)
      return {
        success: false,
        message: categoryError,
        errors: { categoryId: [categoryError] }
      }

    const updated = await articleQuery.update(id, {
      ...validated.data,
      publishedAt: validated.data.publishedAt
        ? new Date(validated.data.publishedAt)
        : null
    })

    revalidatePath('/dashboard/articles')
    revalidatePath(`/dashboard/articles/${id}`)
    updateTag('articles')
    logger.info('Artikel diperbarui', { actorId: user.id, articleId: id })

    return {
      success: true,
      message: 'Artikel berhasil diperbarui',
      data: updated
    }
  } catch (error) {
    logger.error('Gagal memperbarui artikel: {error}', {
      error,
      articleId: id,
      input: redact(input as Record<string, unknown>)
    })
    if (error instanceof Error && error.message.includes('unique constraint'))
      return {
        success: false,
        message: 'Permalink sudah dipakai di organisasi ini.',
        errors: { slug: ['Permalink sudah dipakai di organisasi ini.'] }
      }
    return {
      success: false,
      message: 'Terjadi kesalahan saat memperbarui artikel'
    }
  }
}
