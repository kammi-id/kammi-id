import { ogImage, ogImageConfig } from '~/components/og-image'
import {
  resolveStrukturIdFromParams,
  getStrukturIdentity,
  type StrukturRouteParams
} from '~/app/(main)/_data/struktur'
import { resolveAbsoluteSiteImage } from '~/lib/utils/site-image'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

type ImageProps = { params: StrukturRouteParams }

const Image = async ({ params }: ImageProps) => {
  const orgId = await resolveStrukturIdFromParams(params)
  const identity = await getStrukturIdentity(orgId)

  const logoUrl = identity?.logo
    ? await resolveAbsoluteSiteImage(identity.logo, identity)
    : undefined

  return ogImage({
    title: 'Berita',
    strukturName: identity?.name ?? 'KAMMI.id',
    logoUrl,
    subtitle: 'Kabar terkini dari KAMMI'
  })
}

export default Image
