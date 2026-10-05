import Link from 'next/link'
import Image from 'next/image'
import { cacheTag } from 'next/cache'
import { HugeiconsIcon } from '@hugeicons/react'
import Logo from '~/assets/logo-header.png'
import { getFooterSettings } from '~/app/(main)/_data/site-settings'
import { getStrukturIdentity } from '~/app/(main)/_data/struktur'
import { listSitePages } from '~/db/query/site-pages'
import { normalizeFooter, isSiteLink } from '~/lib/site-links'
import { siteIcon } from '~/lib/site-icons'
import { resolveSiteImage } from '~/lib/utils/site-image'

export const Footer = async ({
  organizationId
}: {
  organizationId: string | null
}) => {
  'use cache'
  if (!organizationId) return null
  cacheTag(
    `article-${organizationId}`,
    `site-settings-footer-${organizationId}`,
    `struktur-${organizationId}`
  )
  const [settings, identity, pages] = await Promise.all([
    getFooterSettings(organizationId),
    getStrukturIdentity(organizationId),
    listSitePages(organizationId)
  ])
  const footer = normalizeFooter(settings)
  const logo = identity?.logo ? await resolveSiteImage(identity.logo) : Logo
  const menus = footer.menus.map((menu) => ({
    ...menu,
    links: menu.links.flatMap((link) => {
      const page = link.pageId
        ? pages.find((page) => page.id === link.pageId)
        : null
      const href = link.pageId ? (page ? `/${page.slug}` : '') : link.href
      return isSiteLink(href) ? [{ ...link, href }] : []
    })
  }))
  return (
    <footer className='bg-muted'>
      <div className='mx-auto max-w-7xl px-6 py-12 lg:px-8'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
          <div className='flex flex-col gap-4 pb-4 md:col-span-2 md:pr-8'>
            <Image
              src={logo || Logo}
              alt={identity?.name ?? 'KAMMI'}
              width={206}
              height={64}
              className='h-16 w-auto self-start object-contain'
              sizes='206px'
              unoptimized={typeof logo === 'string' && logo.startsWith('http')}
            />
            <p className='font-heading text-lg font-semibold'>
              {identity?.name ?? 'KAMMI'}
            </p>
            <address className='text-muted-foreground flex flex-col gap-2 text-sm leading-relaxed not-italic'>
              {footer.address && (
                <p className='max-w-md whitespace-pre-line'>{footer.address}</p>
              )}
              {footer.phone && (
                <a
                  href={`tel:${footer.phone.replace(/[^+\d]/g, '')}`}
                  className='w-fit hover:underline'
                >
                  {footer.phone}
                </a>
              )}
              {footer.email && (
                <a
                  href={`mailto:${footer.email}`}
                  className='w-fit break-all hover:underline'
                >
                  {footer.email}
                </a>
              )}
            </address>
          </div>
          {menus.map(
            (menu, index) =>
              menu.links.length > 0 && (
                <nav key={index} aria-label={menu.title} className='pb-4'>
                  <h2 className='font-heading font-semibold'>{menu.title}</h2>
                  <ul className='mt-4 flex flex-col gap-3'>
                    {menu.links.map((link, index) => (
                      <li key={index}>
                        <Link
                          href={link.href}
                          className='text-muted-foreground hover:text-foreground text-sm hover:underline'
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              )
          )}
          {footer.socials.some((link) => isSiteLink(link.href)) && (
            <nav
              aria-label='Media sosial'
              className='flex flex-wrap gap-4 py-6 md:col-span-4'
            >
              {footer.socials
                .filter((link) => isSiteLink(link.href))
                .map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center gap-2 text-sm hover:underline'
                  >
                    <HugeiconsIcon
                      icon={siteIcon(link.icon)}
                      className='size-5'
                      aria-hidden='true'
                    />
                    {link.label}
                  </a>
                ))}
            </nav>
          )}
        </div>
        <p className='text-muted-foreground mt-4 text-xs'>
          &copy; {new Date().getFullYear()} {identity?.name ?? 'KAMMI'}. Hak
          Cipta Dilindungi.
        </p>
      </div>
    </footer>
  )
}
