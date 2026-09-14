import { ogImage, ogImageConfig } from '~/components/og-image'
import {
  resolveStrukturIdFromParams,
  resolveStrukturOgBranding,
  type StrukturRouteParams
} from '~/app/(main)/_data/struktur'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

type ImageProps = { params: StrukturRouteParams }

const Image = async ({ params }: ImageProps) => {
  const orgId = await resolveStrukturIdFromParams(params)
  const branding = await resolveStrukturOgBranding(orgId)

  return ogImage({
    title: 'Event & Agenda',
    subtitle: 'Pelatihan, seminar, dan kongres KAMMI',
    ...branding
  })
}

export default Image
