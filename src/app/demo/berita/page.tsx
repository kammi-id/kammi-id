import Image from 'next/image'
import Link from 'next/link'
import {
  demoNewsArticles,
  demoNewsCategories
} from './_data/news'
import { BeritaFilters } from './_components/berita-filters'

const DemoBeritaPage = () => (
  <main className='min-h-screen bg-white text-slate-950'>
    <header className='border-b border-slate-200'>
      <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8'>
        <Link href='/demo/berita' aria-label='KAMMI ID'>
          <Image
            src='/demo-news-placeholder.svg'
            alt='Logo KAMMI'
            width={150}
            height={56}
            className='h-14 w-[9.5rem] object-cover object-left'
          />
        </Link>
        <nav className='hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex'>
          <span>Tentang⌄</span>
          <span className='text-slate-950'>Berita</span>
          <span>Event</span>
          <span>Dashboard</span>
          <span>Job Vacancy</span>
        </nav>
        <button
          type='button'
          className='rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground'
        >
          Bergabung di KAMMI
        </button>
      </div>
    </header>

    <section className='mx-auto max-w-7xl px-6 pb-24 pt-7 lg:px-8'>
      <nav aria-label='Breadcrumb' className='text-sm text-slate-500'>
        <span>Beranda</span>
        <span className='mx-2'>/</span>
        <span className='font-medium text-slate-950'>Berita</span>
      </nav>
      <h1 className='font-heading mt-8 text-4xl font-bold tracking-tight sm:text-5xl'>
        Berita
      </h1>
      <BeritaFilters
        articles={demoNewsArticles}
        categories={demoNewsCategories}
      />
    </section>
  </main>
)

export default DemoBeritaPage
