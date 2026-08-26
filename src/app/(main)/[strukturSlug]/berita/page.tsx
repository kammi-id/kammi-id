import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buildBreadcrumb } from '~/lib/seo'
import {
  resolveStrukturIdFromParams,
  type StrukturRouteParams
} from '~/app/(main)/_data/struktur'
import { BeritaArchive } from './_components/berita-archive'

type BeritaPageProps = {
  params: StrukturRouteParams
  searchParams: Promise<{ page?: string }>
}

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

// A non-numeric or missing `?page=` reads as page 1; anything below 1
// clamps up to it. `listBeritaArsipForOrg` (and `BeritaArchive`) treat an
// out-of-range page *above* the last one as `notFound()` once the query
// comes back empty — this only guards the parse itself.
const parsePage = (raw: string | undefined): number => {
  const n = Number.parseInt(raw ?? '1', 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

const BeritaPage = async ({ params, searchParams }: BeritaPageProps) => {
  const [organizationId, { page: rawPage }] = await Promise.all([
    resolveStrukturIdFromParams(params),
    searchParams
  ])

  // `[strukturSlug]/layout.tsx` already answers not-found for an unknown
  // slug before this page renders (ticket 02) — this is the same defensive
  // fallback the root `page.tsx` uses for the same reason.
  if (!organizationId) notFound()

  const page = parsePage(rawPage)

  return (
    <section className='bg-background min-h-[70vh] pb-24'>
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
            <span className='text-foreground font-medium'>Berita</span>
          </li>
        </ol>
      </nav>

      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <h1 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl'>
          Berita
        </h1>
      </div>

      <BeritaArchive organizationId={organizationId} page={page} />
    </section>
  )
}

export default BeritaPage
