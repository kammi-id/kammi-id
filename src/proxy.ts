import { NextResponse, NextRequest } from 'next/server'
import { readActiveSession } from '~/lib/auth/cookies'
import { readOrganization } from '~/db/query/organization'
import { resolveTenantHost, ROOT_DOMAIN } from '~/lib/struktur/tenant-host'

export const config = {
  // Excludes `_next`, `/api/*`, and any path with a file extension (assets,
  // `robots.txt`, `sitemap.xml`, …) — everything else, including `/dashboard`
  // and `/login`, still reaches `proxy()` below.
  matcher: ['/berita/feed.xml', '/((?!_next|api|.*\\..*).*)']
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
  // `Host` menentukan Struktur yang melayani (ADR 0012) — apex dan
  // `staging.kammi.id` melayani PP, `<slug>.kammi.id` melayani Struktur itu.
  //
  // Dibaca dari header `Host`, **bukan** `request.nextUrl.hostname`: di balik
  // proxy sungguhan (dan bahkan di server dev lokal), `nextUrl.hostname`
  // mencerminkan alamat bind server (mis. "localhost"), bukan `Host` yang
  // dikirim klien — kalau dipakai, setiap subdomain diam-diam jatuh ke apex.
  const hostHeader = request.headers.get('host') ?? request.nextUrl.hostname
  const routing = resolveTenantHost(hostHeader.split(':')[0])

  if (routing.kind === 'redirect-to-apex') {
    const url = request.nextUrl.clone()
    url.hostname = ROOT_DOMAIN
    return NextResponse.redirect(url, 308)
  }

  let slug: string
  if (routing.kind === 'subdomain') {
    slug = routing.slug
  } else {
    // Apex: rewrite target adalah slug PP sesungguhnya, bukan literal "pp".
    // Kalau PP tidak dapat ditemukan (DB terputus saat request, atau belum
    // ada baris PP), tidak ada tempat merewrite tujuan — biarkan jatuh ke
    // tidak ditemukan alih-alih menciptakan mode darurat baru atau
    // menjatuhkan seluruh situs publik dengan 500.
    let pp: { slug: string } | undefined
    try {
      ;[pp] = await readOrganization({ type: ['pp'], limit: 1 })
    } catch {
      return
    }
    if (!pp) return
    slug = pp.slug
  }

  // ADR 0012: alamat hasil rewrite (`/${slug}/...`) tidak boleh melayani 200
  // ketika diketik langsung dari luar — di mata mesin pencari itu jadi
  // duplicate content. Diperiksa lewat perbandingan string, bukan query DB:
  // bentuk internal yang mau dicegah persis `/${slug}/...` — segmen pertama
  // sama dengan slug tujuan rewrite ini sendiri — dan itu sudah cukup
  // diketahui dari `slug` yang barusan ditentukan, tanpa query tambahan pada
  // setiap permintaan situs publik.
  if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) {
    const blocked = request.nextUrl.clone()
    blocked.pathname = '/__internal-path-blocked'
    return NextResponse.rewrite(blocked)
  }

  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' ? `/${slug}` : `/${slug}${pathname}`
  return NextResponse.rewrite(url)
}
