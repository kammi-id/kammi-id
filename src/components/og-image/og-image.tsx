import { ImageResponse } from 'next/og'
import {
  buildStrukturMetaLine,
  resolveOgImageMode,
  resolveTitleFontSize,
  truncateTitle
} from './utils'

export const ogImageConfig = {
  size: { width: 1200, height: 630 },
  contentType: 'image/png' as const
}

export type OgImageInput = {
  title: string
  /** Never hardcode "KAMMI.id" here for a non-PP Situs — always the actual Struktur. */
  strukturName: string
  /** Absolute URL. Omit (or on fetch failure) → the "KAMMI.id" wordmark. */
  logoUrl?: string
  /** Absolute URL. Presence (and a successful fetch) → mode "Bergambar". */
  imageUrl?: string
  /** Already formatted for display (`formatTanggalTerbit`), not raw ISO. */
  publishedAt?: string
  /** Generic section-card callers only — the Permalink Berita caller uses `publishedAt` instead. */
  subtitle?: string
}

// Fetches Public Sans 700 woff2 from Google Fonts CDN.
// The font is cached by Next.js after the first generation.
// If this URL becomes stale, get the current one by fetching:
//   https://fonts.googleapis.com/css2?family=Public+Sans:wght@700&display=swap
// with a Chrome User-Agent and copying the woff2 src URL.
const fetchFont = async () => {
  const res = await fetch(
    'https://fonts.gstatic.com/s/publicsans/v15/ijwRs572Xtc6ZYQws9YVglDOSVB9qQ.woff2'
  )
  if (!res.ok) throw new Error(`Failed to fetch OG font: ${res.status}`)
  return res.arrayBuffer()
}

// Byte gambar (logo maupun Gambar Utama) diambil di sini, bukan dipercayakan
// ke satori lewat `<img src="https://...">` — sama seperti font di atas,
// satori tidak mengambil URL remote sendiri saat merender (ADR 0006/0007:
// byte gambar hidup di volume aplikasi, bukan CDN publik). Kegagalan apa pun
// — jaringan, non-2xx, URL kosong — jatuh ke `undefined`, tidak pernah
// melempar: kartu bagikan yang gagal render lebih buruk daripada kartu polos.
const fetchImageBytes = async (
  url: string | undefined
): Promise<ArrayBuffer | undefined> => {
  if (!url) return undefined
  try {
    const res = await fetch(url)
    if (!res.ok) return undefined
    return await res.arrayBuffer()
  } catch {
    return undefined
  }
}

export const ogImage = async ({
  title,
  strukturName,
  logoUrl,
  imageUrl,
  publishedAt,
  subtitle
}: OgImageInput) => {
  const [fontData, imageBytes, logoBytes] = await Promise.all([
    fetchFont(),
    fetchImageBytes(imageUrl),
    fetchImageBytes(logoUrl)
  ])

  const mode = resolveOgImageMode(imageBytes)
  const metaLine = buildStrukturMetaLine(strukturName, publishedAt)
  const titleFontSize = resolveTitleFontSize(title)
  const displayTitle = truncateTitle(title)

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          background:
            mode === 'bergambar'
              ? '#0c2340'
              : 'linear-gradient(135deg, #1b3f6e 0%, #0c2340 100%)'
        }}
      >
        {mode === 'bergambar' && (
          // eslint-disable-next-line @next/next/no-img-element -- satori JSX rendered by ImageResponse, not a DOM <img>; next/image doesn't apply here.
          <img
            // @ts-expect-error Satori accepts ArrayBuffer for <img src> at runtime.
            src={imageBytes}
            alt=''
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1200px',
              height: '630px',
              objectFit: 'cover'
            }}
          />
        )}

        {/* Scrim tetap (bukan adaptif): satori/`ImageResponse` tidak bisa
            mengukur kecerahan foto, jadi gradiennya dipatok gelap (75% di
            bawah menuju 35% di atas) agar judul selamat dari foto paling
            terang. Foto yang sudah gelap jadi tambah gelap — harga yang
            dibayar sadar demi keterbacaan, bukan bug. */}
        {mode === 'bergambar' && (
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '1200px',
              height: '630px',
              background:
                'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 100%)'
            }}
          />
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            position: 'absolute',
            top: '48px',
            left: '64px'
          }}
        >
          {logoBytes ? (
            // eslint-disable-next-line @next/next/no-img-element -- satori JSX rendered by ImageResponse, not a DOM <img>; next/image doesn't apply here.
            <img
              // @ts-expect-error Satori accepts ArrayBuffer for <img src> at runtime.
              src={logoBytes}
              alt=''
              style={{ height: '48px' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                color: 'rgba(255,255,255,0.7)',
                fontSize: '20px',
                fontFamily: 'Public Sans',
                letterSpacing: '6px',
                textTransform: 'uppercase'
              }}
            >
              KAMMI.id
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'absolute',
            left: '64px',
            right: '64px',
            bottom: '56px'
          }}
        >
          <div
            style={{
              display: 'flex',
              color: '#ffffff',
              fontSize: `${titleFontSize}px`,
              fontFamily: 'Public Sans',
              fontWeight: 700,
              lineHeight: 1.15,
              wordBreak: 'break-word',
              marginBottom: '20px'
            }}
          >
            {displayTitle}
          </div>
          <div
            style={{
              display: 'flex',
              color: 'rgba(255,255,255,0.75)',
              fontSize: '28px',
              fontFamily: 'Public Sans',
              fontWeight: 700,
              marginBottom: subtitle ? '8px' : '0'
            }}
          >
            {metaLine}
          </div>
          {subtitle && (
            <div
              style={{
                display: 'flex',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '30px',
                fontFamily: 'Public Sans',
                fontWeight: 700
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    ),
    {
      ...ogImageConfig.size,
      fonts: [
        {
          name: 'Public Sans',
          data: fontData,
          weight: 700,
          style: 'normal'
        }
      ]
    }
  )
}
