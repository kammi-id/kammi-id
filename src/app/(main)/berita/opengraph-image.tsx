import { ogImage, ogImageConfig } from '~/components/og-image'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

const Image = async () =>
  ogImage({ title: 'Berita', subtitle: 'Kabar terkini dari KAMMI' })

export default Image
