import type { Metadata } from 'next'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon, ArrowRight01Icon } from '@hugeicons/core-free-icons'

export const metadata: Metadata = {
  title: 'Tentang — KAMMI.id',
  description: 'Mengenal profil, sejarah, visi, misi, dan struktur perjuangan Kesatuan Aksi Mahasiswa Muslim Indonesia.',
}

const TentangPage = () => {
  return (
    <div className='bg-background min-h-[70vh] pb-24'>
      {/* Breadcrumb */}
      <nav aria-label='Breadcrumb' className='mx-auto max-w-7xl px-6 py-5 lg:px-8'>
        <ol className='flex items-center gap-2 text-sm text-muted-foreground'>
          <li>
            <Link href='/' className='hover:text-foreground transition-colors'>
              Beranda
            </Link>
          </li>
          <li aria-hidden='true' className='select-none text-muted-foreground/45'>
            /
          </li>
          <li>
            <span className='font-medium text-foreground'>Tentang KAMMI</span>
          </li>
        </ol>
      </nav>

      {/* Content Section */}
      <div className='mx-auto max-w-3xl px-6 pt-8 text-center lg:px-8'>
        <div className='mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/5 text-primary ring-1 ring-primary/10'>
          <HugeiconsIcon
            icon={InformationCircleIcon}
            className='size-8'
            strokeWidth={1.5}
          />
        </div>

        <h1 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl'>
          Tentang <span className='text-primary'>KAMMI</span>
        </h1>
        
        <p className='text-muted-foreground mx-auto mt-4 max-w-xl font-sans text-base leading-relaxed md:text-lg'>
          Kami sedang merapikan lembaran sejarah, visi, misi, serta konstitusi gerakan Kesatuan Aksi Mahasiswa Muslim Indonesia untuk disajikan secara interaktif.
        </p>

        {/* Feature Navigation Card */}
        <div className='border-border/60 bg-muted/30 mx-auto mt-12 max-w-md rounded-3xl border p-6 text-left backdrop-blur-xs'>
          <h3 className='font-heading text-foreground text-sm font-bold uppercase tracking-wider text-primary/80'>
            Sudah Tersedia
          </h3>
          <p className='text-muted-foreground mt-2 font-sans text-sm leading-relaxed'>
            Meskipun profil lengkap organisasi sedang kami persiapkan, struktur kepemimpinan utama saat ini sudah dapat diakses secara publik.
          </p>
          <div className='mt-5'>
            <Link
              href='/tentang/pengurus'
              className='bg-primary text-primary-foreground hover:bg-primary/95 group inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 font-sans text-sm font-semibold transition-all'
            >
              Lihat Struktur Pengurus Pusat
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className='size-4 transition-transform group-hover:translate-x-0.5'
                strokeWidth={2}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TentangPage
