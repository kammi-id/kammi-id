import { ogImage, ogImageConfig } from '~/components/og-image'
import { resolveAbsoluteSiteImage } from '~/lib/utils/site-image'
import { formatTanggalTerbit } from '~/lib/publikasi/tanggal-terbit'
import { resolveOutcome, type BeritaDetailParams } from './page'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

type ImageProps = { params: BeritaDetailParams }

// `alt` (og:image:alt, ticket 04 item 7) butuh judul Artikel yang dinamis
// per Artikel — `export const alt = '...'` biasa dibaca statis oleh Next
// (lihat `next-metadata-image-loader.js`), tidak pernah dipanggil dengan
// `params`. `generateImageMetadata` adalah satu-satunya jalur resmi yang
// menerima `params` dan bisa mengembalikan `alt` per-request.
export const generateImageMetadata = async ({ params }: ImageProps) => {
  const { articleRow, outcome } = await resolveOutcome(params)
  const alt = outcome?.kind === 'ok' && articleRow ? articleRow.title : 'KAMMI.id'

  return [
    {
      id: 'default',
      alt,
      size: ogImageConfig.size,
      contentType: ogImageConfig.contentType
    }
  ]
}

const Image = async ({ params }: ImageProps) => {
  const { articleRow, org, outcome } = await resolveOutcome(params)

  if (outcome?.kind !== 'ok' || !articleRow || !org) {
    return ogImage({ title: 'KAMMI.id', strukturName: 'KAMMI.id' })
  }

  const [logoUrl, imageUrl] = await Promise.all([
    resolveAbsoluteSiteImage(org.logo, org),
    resolveAbsoluteSiteImage(articleRow.featuredImage, org)
  ])

  return ogImage({
    title: articleRow.title,
    strukturName: org.name,
    logoUrl,
    imageUrl,
    publishedAt: articleRow.publishedAt
      ? formatTanggalTerbit(articleRow.publishedAt)
      : undefined
  })
}

export default Image
