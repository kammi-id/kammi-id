import type { Metadata } from 'next'
import { buildBreadcrumb } from '~/lib/seo'

export const metadata: Metadata = {
  title: 'Berita',
  description:
    'Kabar terkini dan informasi resmi dari Kesatuan Aksi Mahasiswa Muslim Indonesia.',
  openGraph: {
    title: 'Berita',
    description:
      'Kabar terkini dan informasi resmi dari Kesatuan Aksi Mahasiswa Muslim Indonesia.'
  }
}

export default function BeritaPage() {
  return (
    <section className='flex min-h-[60vh] flex-col items-center justify-center bg-gradient-to-b from-purple-100 to-white'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: 'Beranda', url: '/' },
              { name: 'Berita', url: '/berita' }
            ])
          )
        }}
      />
      <h1 className='mb-4 text-4xl font-bold text-gray-800'>Berita KAMMI</h1>
      <p className='text-lg text-gray-600'>Belum ada konten.</p>
    </section>
  )
}
