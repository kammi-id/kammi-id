import Image from 'next/image'
import Link from 'next/link'

const PUBLICATIONS = [
  {
    id: 'pub-1',
    category: 'Opini',
    date: '12 Jan 2025',
    title: 'Digitalisasi Dakwah: Kampus di Era Konektivitas Global',
    excerpt:
      'Mengeksplorasi bagaimana platform digital mengubah cara gerakan dakwah mahasiswa beradaptasi dengan era baru.',
    seed: 'pub-1',
    href: '#'
  },
  {
    id: 'pub-2',
    category: 'Kajian',
    date: '5 Feb 2025',
    title: 'KAMMI Soroti Kebijakan Pendidikan Nasional',
    excerpt:
      'Analisis dan rekomendasi KAMMI terhadap kebijakan anggaran pendidikan yang mempengaruhi akses kampus.',
    seed: 'pub-2',
    href: '#'
  },
  {
    id: 'pub-3',
    category: 'Laporan',
    date: '20 Mar 2025',
    title: 'Laporan Tahunan Pendidikan Kader Mahasiswa 2024',
    excerpt:
      'Rekap komprehensif program pengembangan kapasitas kader KAMMI sepanjang tahun 2024.',
    seed: 'pub-3',
    href: '#'
  }
]

const CATEGORY_COLORS: Record<string, string> = {
  Opini: 'bg-blue-50 text-blue-700',
  Kajian: 'bg-amber-50 text-amber-700',
  Laporan: 'bg-primary/10 text-primary'
}

export const PublicationsSection = () => {
  return (
    <section
      id='event'
      className='bg-background py-20 lg:py-28'
      aria-labelledby='publications-heading'
    >
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mb-10 flex items-end justify-between'>
          <div>
            <h2
              id='publications-heading'
              className='font-heading text-[clamp(1.5rem,3vw,2rem)] font-bold text-foreground'
            >
              Berita Organisasi
            </h2>
            <div className='mt-1 h-1 w-12 rounded-full bg-primary' aria-hidden='true' />
          </div>
          <Link
            href='/berita'
            className='hidden font-sans text-sm font-semibold text-primary hover:underline sm:block'
          >
            Lihat Semua &rarr;
          </Link>
        </div>

        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {PUBLICATIONS.map((pub) => (
            <article key={pub.id} className='group flex flex-col overflow-hidden rounded-2xl border border-border bg-background'>
              <div className='relative overflow-hidden'>
                <Image
                  src={`https://picsum.photos/seed/${pub.seed}/600/340`}
                  alt={`Ilustrasi artikel: ${pub.title}`}
                  width={600}
                  height={340}
                  className='h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105'
                />
              </div>
              <div className='flex flex-1 flex-col p-5'>
                <div className='flex items-center gap-3'>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-sans text-xs font-semibold ${CATEGORY_COLORS[pub.category] ?? 'bg-muted text-muted-foreground'}`}
                  >
                    {pub.category}
                  </span>
                  <time
                    dateTime={pub.date}
                    className='font-sans text-xs text-muted-foreground'
                  >
                    {pub.date}
                  </time>
                </div>
                <h3 className='mt-3 font-heading text-base font-bold leading-snug text-foreground'>
                  <Link href={pub.href} className='hover:text-primary transition-colors'>
                    {pub.title}
                  </Link>
                </h3>
                <p className='mt-2 flex-1 font-sans text-sm leading-relaxed text-muted-foreground line-clamp-3'>
                  {pub.excerpt}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className='mt-6 flex justify-center sm:hidden'>
          <Link
            href='/berita'
            className='font-sans text-sm font-semibold text-primary hover:underline'
          >
            Lihat Semua Publikasi &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
