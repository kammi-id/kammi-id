import { NextResponse, NextRequest } from 'next/server'
import { readActiveSession } from '~/lib/auth/cookies'
import { readOrganization } from '~/db/query/organization'
import { resolveTenantHost, ROOT_DOMAIN } from '~/lib/struktur/tenant-host'

export const config = {
  // Excludes `_next`, `/api/*`, and any path with a file extension (assets,
  // `robots.txt`, `sitemap.xml`, …) — everything else, including `/dashboard`
  // and `/login`, still reaches `proxy()` below.
  //
  // Ticket 06 (ADR 0024, Salinan Markdown): the exclusion above drops every
  // dotted path, so a `.md` suffix never reached `proxy()` on its own — these
  // two extra entries claw back exactly the two Permalink shapes this ticket
  // serves. Path-to-regexp's `:param` matches up to (and excluding) the
  // literal `.md` that follows it, so each entry captures everything before
  // the suffix without needing a hand-rolled regex:
  //   - `/:slug.md`                    → `/halaman-slug.md`, and also
  //                                       `/berita.md` (the index, ticket 06)
  //   - `/berita/:tahun/:bulan/:slug.md` → `/berita/2026/09/judul.md`
  // Content negotiation (`Accept: text/markdown` on the plain address, no
  // suffix) needs no new entry — that request has no dot, so it already
  // matches the catch-all above.
  matcher: [
    '/berita/feed.xml',
    '/((?!_next|api|.*\\..*).*)',
    '/:slug.md',
    '/berita/:tahun/:bulan/:slug.md'
  ]
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
  // `Host` menentukan Struktur yang melayani (ADR 0012) — `www.kammi.id` dan
  // `staging.kammi.id` melayani PP, `<slug>.kammi.id` melayani Struktur itu.
  // PP di `www`, bukan apex, karena Cloudflare sudah redirect apex ke `www`
  // duluan dan itu bukan rule yang kita ubah (ADR 0018).
  //
  // Dibaca dari header `Host`, **bukan** `request.nextUrl.hostname`: di balik
  // proxy sungguhan (dan bahkan di server dev lokal), `nextUrl.hostname`
  // mencerminkan alamat bind server (mis. "localhost"), bukan `Host` yang
  // dikirim klien — kalau dipakai, setiap subdomain diam-diam jatuh ke apex.
  const hostHeader = request.headers.get('host') ?? request.nextUrl.hostname
  const routing = resolveTenantHost(hostHeader.split(':')[0])

  if (routing.kind === 'redirect-to-www') {
    // `nextUrl.clone()` membawa port bind internal container (3000) karena
    // Traefik tidak diteruskan lewat X-Forwarded-Port yang dipercaya di sini
    // — kalau cuma `hostname` yang diganti, redirect publik bocor jadi
    // "https://kammi.id:3000/" dan mati bagi klien di luar Docker network.
    // Protokol dan port dipatok eksplisit, tidak diwarisi dari request masuk.
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    url.hostname = `www.${ROOT_DOMAIN}`
    url.port = ''
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

  // Ticket 06 (ADR 0024): Salinan Markdown. Two triggers — a `.md` suffix,
  // or a plain Permalink request that sends `Accept: text/markdown` — both
  // rewrite to the SAME hidden internal route tree
  // (`src/app/salinan-markdown/[strukturSlug]/...`), which mirrors the public
  // tree one segment lower (Berita's `berita/[tahun]/[bulan]/[slug]` shape,
  // the Halaman `[slug]` shape, and the `berita` index). That is what keeps
  // the actual Markdown-emitting logic in exactly one place — those
  // `route.ts` files — rather than duplicated per trigger (ADR 0024's
  // explicit ask: "satu cabang pada penangan yang sama, bukan penangan
  // kedua").
  //
  // Deliberately NOT `__markdown` (leading underscore): Next.js treats any
  // `_`-prefixed folder under `app/` as a private folder excluded from
  // routing entirely (`node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`)
  // — that's exactly what makes `/__internal-path-blocked` above permanently
  // unroutable by design. This tree needs the opposite: real `route.ts`
  // files that actually execute. Verified live (`next dev` + `curl`) that
  // `__markdown` silently fell through to Next's default not-found render
  // instead of ever reaching the handler, before renaming to this.
  //
  // The `.md` suffix is stripped here, not in the hidden route — the target
  // pathname must match the SAME dynamic segments (`[tahun]`, `[bulan]`,
  // `[slug]`) the public tree uses. Whether the suffix was present is
  // instead threaded through as a request header: the hidden route needs it
  // to know whether a canonical-address REDIRECT it issues (ADR 0014
  // permalink history, non-canonical tahun/bulan) should itself carry a
  // `.md` suffix — "alamat lama ber-`.md` ikut `permanentRedirect` ke alamat
  // baru ber-`.md`" (tiket 06) — which the stripped pathname alone can no
  // longer tell it.
  const isMdSuffix = pathname.endsWith('.md')
  const acceptsMarkdown = (request.headers.get('accept') ?? '').includes(
    'text/markdown'
  )

  if (isMdSuffix || acceptsMarkdown) {
    const strippedPath = isMdSuffix
      ? pathname.slice(0, -'.md'.length)
      : pathname
    const markdownUrl = request.nextUrl.clone()
    markdownUrl.pathname =
      strippedPath === '/'
        ? `/salinan-markdown/${slug}`
        : `/salinan-markdown/${slug}${strippedPath}`

    const forwardedHeaders = new Headers(request.headers)
    forwardedHeaders.set('x-kammi-md-suffix', isMdSuffix ? '1' : '0')
    return NextResponse.rewrite(markdownUrl, {
      request: { headers: forwardedHeaders }
    })
  }

  const url = request.nextUrl.clone()
  url.pathname = pathname === '/' ? `/${slug}` : `/${slug}${pathname}`
  return NextResponse.rewrite(url)
}
