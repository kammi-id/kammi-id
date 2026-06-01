'use server'

import { cookies } from 'next/headers'
import { revalidatePath, updateTag } from 'next/cache'
import { validateSession } from '~/lib/auth/api'
import { upsertSiteSettings } from '~/db/query/site-settings'
import { z } from 'zod'

export type SettingsActionState = {
  success?: boolean
  error?: string
  fieldErrors?: Record<string, string[]>
  values?: Record<string, string>
}

const checkAccess = async (): Promise<{ orgId: string } | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('kammi_id_session')?.value
  if (!token) return null

  const session = await validateSession(token)
  if (!session) return null

  const { role, connectedOrganization } = session.user
  if (role !== 'root' && role !== 'humas') return null

  const orgId = connectedOrganization?.id
  if (!orgId) return null

  return { orgId }
}

const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1)
})

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
  const access = await checkAccess()
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
  sejarahCardDescription: z.string().min(1, 'Deskripsi card sejarah wajib diisi.'),
  sejarahCardLinkLabel: z.string().min(1),
  sejarahCardLinkHref: z.string().min(1)
})

export const saveAboutAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await checkAccess()
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
  const access = await checkAccess()
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

// ─── Nav ─────────────────────────────────────────────────────────────────────

const navSchema = z.object({
  navLinks: z.array(linkSchema).min(1),
  ctaBergabungLabel: z.string().min(1),
  ctaBergabungHref: z.string().min(1)
})

export const saveNavAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await checkAccess()
  if (!access) return { error: 'Akses ditolak.' }
  const { orgId } = access

  const raw = Object.fromEntries(formData)
  let navLinks
  try {
    navLinks = JSON.parse(raw.navLinks as string)
  } catch {
    return { error: 'Data navigasi tidak valid.' }
  }

  const result = navSchema.safeParse({ ...raw, navLinks })
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
    await upsertSiteSettings('nav', result.data, orgId)
    revalidatePath('/')
    updateTag(`site-settings-nav-${orgId}`)
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan pengaturan navigasi.' }
  }
}

// ─── Footer ──────────────────────────────────────────────────────────────────

const footerSchema = z.object({
  socialIG: z.string(),
  socialTwitter: z.string(),
  socialYoutube: z.string(),
  socialTelegram: z.string(),
  footerKAMMI: z.array(linkSchema),
  footerBeritaData: z.array(linkSchema),
  footerIkutiKami: z.array(linkSchema)
})

export const saveFooterAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await checkAccess()
  if (!access) return { error: 'Akses ditolak.' }
  const { orgId } = access

  const raw = Object.fromEntries(formData)
  let footerKAMMI, footerBeritaData, footerIkutiKami
  try {
    footerKAMMI = JSON.parse(raw.footerKAMMI as string)
    footerBeritaData = JSON.parse(raw.footerBeritaData as string)
    footerIkutiKami = JSON.parse(raw.footerIkutiKami as string)
  } catch {
    return { error: 'Data footer tidak valid.' }
  }

  const result = footerSchema.safeParse({
    ...raw,
    footerKAMMI,
    footerBeritaData,
    footerIkutiKami
  })
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
    await upsertSiteSettings('footer', result.data, orgId)
    revalidatePath('/')
    updateTag(`site-settings-footer-${orgId}`)
    return { success: true }
  } catch {
    return { error: 'Gagal menyimpan pengaturan footer.' }
  }
}

// ─── Metadata ────────────────────────────────────────────────────────────────

const metadataSchema = z.object({
  pageTitle: z.string().min(1, 'Judul halaman wajib diisi.'),
  metaDescription: z.string().min(1, 'Deskripsi halaman wajib diisi.'),
  ogImageUrl: z.string().min(1, 'URL gambar OG wajib diisi.')
})

export const saveMetadataAction = async (
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> => {
  const access = await checkAccess()
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
