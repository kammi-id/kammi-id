import { z } from 'zod'

export const isSiteLink = (value: string): boolean => {
  if (!value || /[\s\\\u0000-\u001f]/.test(value)) return false
  if (value.startsWith('#')) return true
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(
      new URL(value).protocol
    )
  } catch {
    return false
  }
}

export const siteLinkSchema = z
  .string()
  .trim()
  .refine(
    isSiteLink,
    'Gunakan alamat situs, https://, mailto:, atau tel: yang valid.'
  )
export const renameEventLink = (href: string): string =>
  href.replace(/^\/event(?=$|[?#])/, '/events')

export type FooterLink = { label: string; href: string; pageId?: string }
export type FooterMenu = { title: string; links: FooterLink[] }
export type SocialLink = { label: string; href: string; icon: string }
export type FooterContent = {
  address: string
  phone: string
  email: string
  menus: FooterMenu[]
  socials: SocialLink[]
}

type LegacyFooter = {
  socialIG?: string
  socialTwitter?: string
  socialYoutube?: string
  socialTelegram?: string
  footerKAMMI?: FooterLink[]
  footerBeritaData?: FooterLink[]
  footerIkutiKami?: FooterLink[]
}

export const normalizeFooter = (
  raw: LegacyFooter & Partial<FooterContent>
): FooterContent => ({
  address: raw.address ?? '',
  phone: raw.phone ?? '',
  email: raw.email ?? '',
  menus: (
    raw.menus ?? [
      { title: 'KAMMI', links: raw.footerKAMMI ?? [] },
      {
        title: 'Berita & Data',
        links: [...(raw.footerBeritaData ?? []), ...(raw.footerIkutiKami ?? [])]
      }
    ]
  ).map((menu) => ({
    ...menu,
    links: menu.links.map((link) => ({
      ...link,
      href: renameEventLink(link.href)
    }))
  })),
  socials:
    raw.socials ??
    [
      { label: 'Instagram', href: raw.socialIG ?? '', icon: 'instagram' },
      { label: 'Twitter / X', href: raw.socialTwitter ?? '', icon: 'x' },
      { label: 'YouTube', href: raw.socialYoutube ?? '', icon: 'youtube' },
      { label: 'Telegram', href: raw.socialTelegram ?? '', icon: 'telegram' }
    ].filter((link) => link.href && link.href !== '#')
})

export const footerContentSchema = z.object({
  address: z.string().trim().max(1000),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine(
      (value) => !value || /^\+?[\d ()-]+$/.test(value),
      'Nomor telepon tidak valid.'
    ),
  email: z.union([z.literal(''), z.email()]),
  menus: z
    .array(
      z
        .object({
          title: z.string().trim().max(100),
          links: z
            .array(
              z
                .object({
                  label: z.string().trim().min(1).max(150),
                  href: siteLinkSchema.or(z.literal('')),
                  pageId: z.uuid().optional()
                })
                .refine(
                  (link) => Boolean(link.pageId || link.href),
                  'Pilih halaman atau isi URL.'
                )
            )
            .max(50)
        })
        .refine(
          (menu) => !menu.links.length || Boolean(menu.title),
          'Judul menu wajib diisi.'
        )
    )
    .length(2),
  socials: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(100),
        href: siteLinkSchema,
        icon: z.string().max(50)
      })
    )
    .max(30)
})
