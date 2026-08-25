import { NextResponse, NextRequest } from 'next/server'
import { readActiveSession } from '~/lib/auth/cookies'
import { readOrganization } from '~/db/query/organization'

export const config = {
  // Excludes `_next`, `/api/*`, and any path with a file extension (assets,
  // `robots.txt`, `sitemap.xml`, …) — everything else, including `/dashboard`
  // and `/login`, still reaches `proxy()` below.
  matcher: ['/((?!_next|api|.*\\..*).*)']
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/dashboard')) {
    const session = await readActiveSession()

    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const adminPaths = [
      '/dashboard/members',
      '/dashboard/alumni',
      '/dashboard/pemandu',
      '/dashboard/instruktur',
      '/dashboard/branches'
    ]
    const isAdminPath = adminPaths.some((path) => pathname.startsWith(path))

    if (isAdminPath && session.user.role === 'member') {
      return NextResponse.redirect(
        new URL('/dashboard?error=unauthorized', request.url)
      )
    }

    return
  }

  if (pathname === '/login') {
    return
  }

  // `opengraph-image` adalah satu-satunya berkas konvensi akar tanpa
  // ekstensi pada URL-nya (yang lain — favicon, manifest, apple-icon —
  // sudah mengandung titik dan lolos dari matcher). Ia milik beranda PP dan
  // tidak ikut pindah ke bawah `[strukturSlug]`.
  if (pathname === '/opengraph-image') {
    return
  }

  // Situs publik: seluruh path lain hidup di bawah segmen `[strukturSlug]`.
  // Untuk tiket ini, semua host melayani PP — pengenalan slug per subdomain
  // menyusul di tiket 02. Kalau PP tidak dapat ditemukan (DB down saat
  // request, DB down, atau belum ada baris PP), tidak ada tempat merewrite
  // tujuan — biarkan jatuh ke tidak ditemukan alih-alih menciptakan mode
  // darurat baru atau menjatuhkan seluruh situs publik dengan 500.
  let pp: { slug: string } | undefined
  try {
    ;[pp] = await readOrganization({ type: ['pp'], limit: 1 })
  } catch {
    return
  }
  if (!pp) return

  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' ? `/${pp.slug}` : `/${pp.slug}${pathname}`
  return NextResponse.rewrite(url)
}
