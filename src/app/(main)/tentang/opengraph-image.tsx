import { ogImage, ogImageConfig } from '~/components/og-image'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

const Image = async () =>
  ogImage({
    title: 'Tentang KAMMI',
    subtitle: 'Sejarah, visi, misi, dan nilai gerakan'
  })

export default Image
