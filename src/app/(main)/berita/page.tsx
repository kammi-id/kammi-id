import type { Metadata } from 'next'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { Note01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'

export const metadata: Metadata = {
  title: 'Berita & Artikel — KAMMI.id',
  description: 'Temukan siaran pers, artikel, analisis isu, dan kabar gerakan terbaru dari Pengurus Pusat KAMMI.',
}

const BeritaPage = () => {
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
            <span className='font-medium text-foreground'>Berita & Publikasi</span>
          </li>
        </ol>
      </nav>

      {/* Content Section */}
      <div className='mx-auto max-w-3xl px-6 pt-8 text-center lg:px-8'>
        <div className='mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/5 text-primary ring-1 ring-primary/10'>
          <HugeiconsIcon
            icon={Note01Icon}
            className='size-8'
            strokeWidth={1.5}
          />
        </div>

        <h1 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl'>
          Kabar & <span className='text-primary'>Publikasi</span>
        </h1>
        
        <p className='text-muted-foreground mx-auto mt-4 max-w-xl font-sans text-base leading-relaxed md:text-lg'>
          Belum ada kabar terbitan untuk saat ini. Departemen Humas sedang mengumpulkan siaran pers, artikel opini kader, dan dokumentasi gerakan terhangat.
        </p>

        {/* Feature Navigation Card */}
        <div className='border-border/60 bg-muted/30 mx-auto mt-12 max-w-md rounded-3xl border p-6 text-left backdrop-blur-xs'>
          <h3 className='font-heading text-foreground text-sm font-bold uppercase tracking-wider text-primary/80'>
            Saluran Alternatif
          </h3>
          <p className='text-muted-foreground mt-2 font-sans text-sm leading-relaxed'>
            Untuk sementara waktu, lu bisa mengikuti pergerakan, rilis pers, serta pernyataan sikap resmi KAMMI Pusat melalui akun media sosial resmi kami.
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

export default BeritaPage
