import type { MetadataRoute } from 'next'

const manifest = (): MetadataRoute.Manifest => ({
  name: 'KAMMI.id',
  short_name: 'KAMMI',
  description: 'Platform digital Kesatuan Aksi Mahasiswa Muslim Indonesia',
  start_url: '/',
  id: 'kammi-id',
  lang: 'id',
  dir: 'ltr',
  display: 'standalone',
  orientation: 'portrait-primary',
  theme_color: '#ffffff',
  background_color: '#ffffff',
  categories: ['education', 'social'],
  icons: [
    {
      src: '/web-app-manifest-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable'
    },
    {
      src: '/web-app-manifest-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    },
    {
      src: '/web-app-manifest-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/web-app-manifest-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    }
  ]
})

export default manifest
