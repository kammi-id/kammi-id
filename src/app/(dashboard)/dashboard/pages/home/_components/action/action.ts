'use server'

import { revalidatePath, updateTag } from 'next/cache'
import { requireSiteSettingsAccess } from '~/lib/auth/site-settings'
import { upsertSiteSettings } from '~/db/query/site-settings'
import { z } from 'zod'

export type SettingsActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  values?: Record<string, string>
}

// ─── Home Hero Items ──────────────────────────────────────────────────────────

const homeItemSchema = z.object({
  id: z.string().min(1),
  imageUrl: z.string(),
  title: z.string().min(1, 'Judul wajib diisi.'),
  description: z.string(),
  badgeText: z.string()
})

const homeItemsSchema = z.array(homeItemSchema)

export const saveHomeHeroItemsAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await requireSiteSettingsAccess()
  if (!access) return { error: 'Akses ditolak.' }
  const { orgId } = access

  let items
  try {
    items = JSON.parse(formData.get('items') as string)
  } catch {
    return { error: 'Data tidak valid.' }
  }

  const result = homeItemsSchema.safeParse(items)
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as unknown as Record<
        string,
        string[]
      >
    }
  }

  try {
    await upsertSiteSettings('home-hero-items', { items: result.data }, orgId)
    revalidatePath('/')
    updateTag(`site-settings-home-hero-items-${orgId}`)
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan hero sections.' }
  }
}

export const saveHomeExtraItemsAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await requireSiteSettingsAccess()
  if (!access) return { error: 'Akses ditolak.' }
  const { orgId } = access

  let items
  try {
    items = JSON.parse(formData.get('items') as string)
  } catch {
    return { error: 'Data tidak valid.' }
  }

  const result = homeItemsSchema.safeParse(items)
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as unknown as Record<
        string,
        string[]
      >
    }
  }

  try {
    await upsertSiteSettings('home-extra-items', { items: result.data }, orgId)
    revalidatePath('/')
    updateTag(`site-settings-home-extra-items-${orgId}`)
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan extra sections.' }
  }
}

// ─── Hero ────────────────────────────────────────────────────────────────────

const heroSchema = z.object({
  badgeText: z.string().min(1, 'Badge text wajib diisi.'),
  title: z.string().min(1, 'Judul wajib diisi.'),
  titleAccent: z.string().min(1, 'Kata aksen wajib diisi.'),
  subtitle: z.string().min(1, 'Subjudul wajib diisi.'),
  heroImageUrl: z.string().min(1, 'URL foto hero wajib diisi.'),
  heroImageAlt: z.string().min(1, 'Alt text foto wajib diisi.'),
  quoteText: z.string().min(1, 'Teks kutipan wajib diisi.'),
  quoteAttribution: z.string().min(1, 'Atribusi kutipan wajib diisi.'),
  cta1Label: z.string().min(1, 'Label CTA 1 wajib diisi.'),
  cta1Href: z.string().min(1, 'Link CTA 1 wajib diisi.'),
  cta2Label: z.string().min(1, 'Label CTA 2 wajib diisi.'),
  cta2Href: z.string().min(1, 'Link CTA 2 wajib diisi.')
})

export const saveHeroAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await requireSiteSettingsAccess()
  if (!access) return { error: 'Akses ditolak.' }
  const { orgId } = access

  const raw = Object.fromEntries(formData)
  const result = heroSchema.safeParse(raw)
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
      values: Object.fromEntries(
        Object.entries(raw).filter(
          ([, v]) => v != null && typeof v === 'string'
        )
      ) as Record<string, string>
    }
  }

  try {
    await upsertSiteSettings('hero', result.data, orgId)
    revalidatePath('/')
    updateTag(`site-settings-hero-${orgId}`)
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan pengaturan hero.' }
  }
}

// ─── About ───────────────────────────────────────────────────────────────────

const aboutSchema = z.object({
  paragraph1: z.string().min(1, 'Paragraf 1 wajib diisi.'),
  paragraph2: z.string().min(1, 'Paragraf 2 wajib diisi.'),
  readMoreLabel: z.string().min(1),
  readMoreHref: z.string().min(1),
  sejarahCardTitle: z.string().min(1, 'Judul card sejarah wajib diisi.'),
  sejarahCardDescription: z
    .string()
    .min(1, 'Deskripsi card sejarah wajib diisi.'),
  sejarahCardLinkLabel: z.string().min(1),
  sejarahCardLinkHref: z.string().min(1)
})

export const saveAboutAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await requireSiteSettingsAccess()
  if (!access) return { error: 'Akses ditolak.' }
  const { orgId } = access

  const raw = Object.fromEntries(formData)
  const result = aboutSchema.safeParse(raw)
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
      values: Object.fromEntries(
        Object.entries(raw).filter(
          ([, v]) => v != null && typeof v === 'string'
        )
      ) as Record<string, string>
    }
  }

  try {
    await upsertSiteSettings('about', result.data, orgId)
    revalidatePath('/')
    updateTag(`site-settings-about-${orgId}`)
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan pengaturan about.' }
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

const actionsSchema = z.object({
  heading: z.string().min(1, 'Judul seksi wajib diisi.'),
  subheading: z.string().min(1),
  programs: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1, 'Label program wajib diisi.'),
        sublabel: z.string().min(1),
        description: z.string().min(1),
        imageUrl: z.string().min(1, 'URL foto wajib diisi.'),
        featured: z.boolean()
      })
    )
    .min(1)
})

export const saveActionsAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await requireSiteSettingsAccess()
  if (!access) return { error: 'Akses ditolak.' }
  const { orgId } = access

  const raw = Object.fromEntries(formData)
  let programs
  try {
    programs = JSON.parse(raw.programs as string)
  } catch {
    return { error: 'Data program tidak valid.' }
  }

  const result = actionsSchema.safeParse({ ...raw, programs })
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
      values: Object.fromEntries(
        Object.entries(raw).filter(
          ([, v]) => v != null && typeof v === 'string'
        )
      ) as Record<string, string>
    }
  }

  try {
    await upsertSiteSettings('actions', result.data, orgId)
    revalidatePath('/')
    updateTag(`site-settings-actions-${orgId}`)
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan pengaturan aksi.' }
  }
}

// ─── Metadata ────────────────────────────────────────────────────────────────

const metadataSchema = z.object({
  pageTitle: z.string().min(1, 'Judul halaman wajib diisi.'),
  metaDescription: z.string().min(1, 'Deskripsi halaman wajib diisi.'),
  ogImageUrl: z.string()
})

export const saveMetadataAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await requireSiteSettingsAccess()
  if (!access) return { error: 'Akses ditolak.' }
  const { orgId } = access

  const raw = Object.fromEntries(formData)
  const result = metadataSchema.safeParse(raw)
  if (!result.success) {
    return {
      fieldErrors: result.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
      values: Object.fromEntries(
        Object.entries(raw).filter(
          ([, v]) => v != null && typeof v === 'string'
        )
      ) as Record<string, string>
    }
  }

  try {
    await upsertSiteSettings('metadata', result.data, orgId)
    revalidatePath('/')
    updateTag(`site-settings-metadata-${orgId}`)
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan metadata halaman.' }
  }
}
