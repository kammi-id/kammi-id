import type { Metadata } from 'next'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar01Icon } from '@hugeicons/core-free-icons'
import { buildBreadcrumb } from '~/lib/seo'

export const metadata: Metadata = {
  title: 'Event & Agenda',
  description:
    'Ikuti berbagai agenda pelatihan kaderisasi, seminar nasional, diskusi publik, dan kongres Kesatuan Aksi Mahasiswa Muslim Indonesia.',
  openGraph: {
    title: 'Event & Agenda',
    description:
      'Ikuti berbagai agenda pelatihan kaderisasi, seminar nasional, diskusi publik, dan kongres Kesatuan Aksi Mahasiswa Muslim Indonesia.'
  }
}

const EventPage = () => {
  return (
    <div className='bg-background min-h-[70vh] pb-24'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: 'Beranda', url: '/' },
              { name: 'Event & Agenda', url: '/event' }
            ])
          )
        }}
      />
      {/* Breadcrumb */}
      <nav
        aria-label='Breadcrumb'
        className='mx-auto max-w-7xl px-6 py-5 lg:px-8'
      >
        <ol className='text-muted-foreground flex items-center gap-2 text-sm'>
          <li>
            <Link href='/' className='hover:text-foreground transition-colors'>
              Beranda
            </Link>
          </li>
          <li
            aria-hidden='true'
            className='text-muted-foreground/45 select-none'
          >
            /
          </li>
          <li>
            <span className='text-foreground font-medium'>Agenda Kegiatan</span>
          </li>
        </ol>
      </nav>

      {/* Content Section */}
      <div className='mx-auto max-w-3xl px-6 pt-8 text-center lg:px-8'>
        <div className='bg-primary/5 text-primary ring-primary/10 mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl ring-1'>
          <HugeiconsIcon
            icon={Calendar01Icon}
            className='size-8'
            strokeWidth={1.5}
          />
        </div>

        <h1 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl'>
          Agenda <span className='text-primary'>Kegiatan</span>
        </h1>

        <p className='text-muted-foreground mx-auto mt-4 max-w-xl font-sans text-base leading-relaxed md:text-lg'>
          Belum ada agenda terdekat saat ini. Bidang Terkait sedang mematangkan
          perencanaan Daurah Marhalah, seminar kepemudaan, dan aksi gerakan
          nasional berikutnya.
        </p>

        {/* Feature Navigation Card */}
        <div className='border-border/60 bg-muted/30 mx-auto mt-12 max-w-md rounded-3xl border p-6 text-left backdrop-blur-xs'>
          <h3 className='font-heading text-foreground text-primary/80 text-sm font-bold tracking-wider uppercase'>
            Informasi Penting
          </h3>
          <p className='text-muted-foreground mt-2 font-sans text-sm leading-relaxed'>
            Pengumuman pendaftaran kegiatan kaderisasi nasional atau wilayah
            akan diinfokan langsung lewat koordinasi berjenjang struktural
            pengurus wilayah/daerah masing-masing.
          </p>
          <div className='mt-5 flex gap-3'>
            <Link
              href='/'
              className='border-border text-foreground hover:bg-muted/40 inline-flex h-11 items-center justify-center rounded-2xl border px-5 font-sans text-sm font-semibold transition-all'
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventPage
