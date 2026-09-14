import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { buildBreadcrumb } from '~/lib/seo'
import {
  resolveStrukturIdFromParams,
  getStrukturIdentity,
  type StrukturRouteParams
} from '~/app/(main)/_data/struktur'
import { BeritaJaringanArchive } from './_components/berita-jaringan-archive'

type BeritaJaringanPageProps = {
  params: StrukturRouteParams
  searchParams: Promise<{ page?: string }>
}

const DESKRIPSI =
  'Kegiatan KAMMI se-Indonesia — kabar terkini dari seluruh Struktur Kesatuan Aksi Mahasiswa Muslim Indonesia.'

export const metadata: Metadata = {
  title: 'Berita KAMMI se-Indonesia',
  description: DESKRIPSI,
  alternates: { canonical: '/berita/seindonesia' },
  openGraph: {
    title: 'Berita KAMMI se-Indonesia',
    description: DESKRIPSI
  }
}

// Same parse as `/berita` (`berita/page.tsx`) — a non-numeric or missing
// `?page=` reads as page 1; anything below 1 clamps up to it.
const parsePage = (raw: string | undefined): number => {
  const n = Number.parseInt(raw ?? '1', 10)
  return Number.isFinite(n) && n >= 1 ? n : 1
}

const BeritaJaringanPage = async ({
  params,
  searchParams
}: BeritaJaringanPageProps) => {
  const [organizationId, { page: rawPage }] = await Promise.all([
    resolveStrukturIdFromParams(params),
    searchParams
  ])

  if (!organizationId) notFound()

  const identity = await getStrukturIdentity(organizationId)

  // Berita KAMMI se-Indonesia hanya ada pada Situs PP (spec "Berita
  // Jaringan" — nama lama istilah ini, ADR 0016),
  // dikondisikan pada Jenjang — bukan pada jalur routing yang berbeda
  // (ADR 0012). Tiap tenant lain yang mengetik alamat ini langsung tidak
  // punya isi yang sah di sini.
  if (!identity || identity.type !== 'pp') notFound()

  const page = parsePage(rawPage)

  return (
    <section className='bg-background min-h-[70vh] pb-24'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb(
              [
                { name: 'Beranda', url: '/' },
                {
                  name: 'Berita KAMMI se-Indonesia',
                  url: '/berita/seindonesia'
                }
              ],
              identity
            )
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
            <span className='text-foreground font-medium'>
              Berita KAMMI se-Indonesia
            </span>
          </li>
        </ol>
      </nav>

      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <h1 className='font-heading text-foreground text-3xl font-bold tracking-tight sm:text-4xl'>
          Berita KAMMI se-Indonesia
        </h1>
        <p className='text-muted-foreground mt-2 font-sans text-sm'>
          Kegiatan KAMMI se-Indonesia
        </p>
      </div>

      <BeritaJaringanArchive page={page} />
    </section>
  )
}

export default BeritaJaringanPage
