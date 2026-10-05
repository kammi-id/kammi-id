import { ogImage, ogImageConfig } from '~/components/og-image'
import {
  resolveStrukturIdFromParams,
  resolveStrukturOgBranding,
  type StrukturRouteParams
} from '~/app/(main)/_data/struktur'
import { getMetadataSettings } from '~/app/(main)/_data/site-settings'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

type ImageProps = { params: StrukturRouteParams }

// Kartu beranda saat Struktur belum mengatur gambar OG. Harus hidup di folder
// yang sama dengan `page.tsx`: `openGraph`/`twitter` milik halaman menimpa
// objek layout secara dangkal, jadi `src/app/opengraph-image.tsx` tidak
// pernah sampai ke beranda.
const Image = async ({ params }: ImageProps) => {
  const orgId = await resolveStrukturIdFromParams(params)
  const [branding, meta] = await Promise.all([
    resolveStrukturOgBranding(orgId),
    getMetadataSettings(orgId)
  ])

  return ogImage({ title: meta.pageTitle, ...branding })
}

export default Image
