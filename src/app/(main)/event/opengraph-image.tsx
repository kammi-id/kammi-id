import { ogImage, ogImageConfig } from '~/components/og-image'

export const size = ogImageConfig.size
export const contentType = ogImageConfig.contentType

const Image = async () =>
  ogImage({ title: 'Event & Agenda', subtitle: 'Pelatihan, seminar, dan kongres KAMMI' })

export default Image
