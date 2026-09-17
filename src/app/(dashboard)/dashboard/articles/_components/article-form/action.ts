'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { readActiveSession } from '~/lib/auth/cookies'
import { articleQuery, isArticleOrgInScope } from '~/db/query/article'
import { articleCategoryQuery } from '~/db/query/article-category'
import { articlePermalinkHistoryQuery } from '~/db/query/article-permalink-history'
import {
  wasPermalinkBeritaLive,
  permalinkBeritaBerubah,
  type ArticlePermalinkState
} from '~/lib/publikasi/permalink-riwayat'
import { deriveTahunBulanTerbit } from '~/lib/publikasi/tanggal-terbit'
import { getLogger, redact } from '~/lib/logger'
import type { ActionResponse } from './types'
import { ArticleInputSchema, type ArticleInput } from './schema'

const logger = getLogger(['app', 'action', 'article'])

const updateArticleCacheTags = (organizationId: string, articleId?: string) => {
  updateTag(`article-${organizationId}`)
  updateTag('berita-jaringan')
  updateTag(`site-active-toggle-${organizationId}`)
  if (articleId) updateTag(`article-detail-${articleId}`)
}

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

/**
 * Ticket 10 (Riwayat alamat Berita, ADR 0014). Dipanggil SEBELUM
 * `articleQuery.update` menimpa `slug`/`published_at` — kalau Permalink lama
 * `existing` pernah benar-benar live (`wasPermalinkBeritaLive`) DAN edit ini
 * benar-benar mengubah bentuknya (`permalinkBeritaBerubah`), alamat lamanya
 * disimpan supaya tautan yang telanjur tersebar tetap punya jalan pulang
 * (dibaca lewat `articlePermalinkHistoryQuery.findCurrentArticleForOldPermalink`
 * di jalur 404 halaman publik). Berita yang belum pernah Terbit (draft, atau
 * published tapi tanggalnya belum lewat) tidak punya alamat publik yang
 * perlu dilindungi — fungsi ini diam saja untuk keduanya.
 */
const recordPermalinkHistoryIfNeeded = async (
  existing: ArticlePermalinkState & { id: string; organizationId: string },
  newValues: { slug: string; publishedAt: Date | null }
): Promise<void> => {
  if (!existing.publishedAt || !newValues.publishedAt) return
  if (
    !wasPermalinkBeritaLive({
      type: existing.type,
      status: existing.status,
      slug: existing.slug,
      publishedAt: existing.publishedAt
    })
  )
    return
  if (
    !permalinkBeritaBerubah(
      { slug: existing.slug, publishedAt: existing.publishedAt },
      { slug: newValues.slug, publishedAt: newValues.publishedAt }
    )
  )
    return

  const old = deriveTahunBulanTerbit(existing.publishedAt)
  await articlePermalinkHistoryQuery.record({
    organizationId: existing.organizationId,
    articleId: existing.id,
    oldSlug: existing.slug,
    oldTahun: old.tahun,
    oldBulan: old.bulan
  })
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
    updateArticleCacheTags(created.organizationId)
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

    const newPublishedAt = validated.data.publishedAt
      ? new Date(validated.data.publishedAt)
      : null

    // WAJIB sebelum `articleQuery.update` di bawah — begitu update jalan,
    // `existing.slug`/`existing.publishedAt` tidak lagi mewakili alamat lama
    // yang perlu dilindungi (ticket 10, ADR 0014).
    await recordPermalinkHistoryIfNeeded(existing, {
      slug: validated.data.slug,
      publishedAt: newPublishedAt
    })

    const updated = await articleQuery.update(id, {
      ...validated.data,
      publishedAt: newPublishedAt
    })

    revalidatePath('/dashboard/articles')
    revalidatePath(`/dashboard/articles/${id}`)
    updateArticleCacheTags(existing.organizationId, id)
    if (updated.organizationId !== existing.organizationId)
      updateArticleCacheTags(updated.organizationId)
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
