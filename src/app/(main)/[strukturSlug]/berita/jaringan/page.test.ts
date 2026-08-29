import { describe, expect, it, mock } from 'bun:test'

// `permanentRedirect` Next melempar untuk menghentikan render; di sini ia
// diganti mata-mata yang ikut melempar, supaya bentuk pemanggilannya bisa
// diperiksa TANPA menjalankan router sungguhan.
const permanentRedirect = mock((to: string) => {
  throw new Error(`REDIRECT:${to}`)
})

mock.module('next/navigation', () => ({ permanentRedirect }))

const { default: BeritaJaringanRedirectPage } = await import('./page')

const redirectTargetOf = async (page?: string): Promise<string> => {
  try {
    await BeritaJaringanRedirectPage({
      searchParams: Promise.resolve(page === undefined ? {} : { page })
    })
  } catch (error) {
    return (error as Error).message.replace('REDIRECT:', '')
  }
  throw new Error('halaman ini wajib redirect, bukan merender')
}

describe('alamat lama /berita/jaringan (ADR 0016)', () => {
  it('mengantar ke /berita/seindonesia', async () => {
    expect(await redirectTargetOf()).toBe('/berita/seindonesia')
  })

  // Tanpa ini, tautan halaman 7 dari hasil pencarian mendarat di halaman 1 —
  // gagal senyap yang tidak akan ada yang laporkan.
  it('membawa serta ?page=', async () => {
    expect(await redirectTargetOf('7')).toBe('/berita/seindonesia?page=7')
  })

  it('meng-encode nilai ?page= yang tidak wajar alih-alih menempelnya mentah', async () => {
    expect(await redirectTargetOf('2&x=1')).toBe(
      '/berita/seindonesia?page=2%26x%3D1'
    )
  })
})
