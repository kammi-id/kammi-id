'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { articleQuery, isArticleOrgInScope } from '~/db/query/article'
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

const assertCanManageArticle = async (
  articleId: string,
  user: { role: string; connectedOrganization?: { id: string } | null }
): Promise<string | null> => {
  const existing = await articleQuery.getById(articleId)
  if (!existing) return 'Artikel tidak ditemukan.'
  return assertCanManageOrg(user, existing.organizationId)
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

    const scopeError = await assertCanManageArticle(id, user)
    if (scopeError) return { success: false, message: scopeError }

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
