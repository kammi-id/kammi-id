import { ogImage, ogImageConfig } from '~/components/og-image'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

const Image = async () =>
  ogImage({
    title: 'KAMMI.id',
    subtitle: 'Kesatuan Aksi Mahasiswa Muslim Indonesia'
  })

export default Image
