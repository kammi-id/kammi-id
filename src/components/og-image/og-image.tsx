import { ImageResponse } from 'next/og'
import { resolveOgImageMode, resolveTitleFontSize, truncateTitle } from './utils'

export const ogImageConfig = {
  size: { width: 1200, height: 630 },
  contentType: 'image/png' as const
}

// Pil tanggal (tiket 10): dari `--primary` di `src/app/globals.css`
// (`oklch(0.52 0.2 17)`). satori tidak membaca CSS custom property saat
// merender, jadi nilainya wajib hex literal — dihitung lewat matriks OKLab
// standar (Björn Ottosson), bukan dikonversi dengan mata atau ditebak.
const OG_PILL_RED = '#C1123D'

// Latar navy: backdrop mode "bergambar" (di belakang foto sebelum termuat)
// dan warna gradien mode "tanpa-gambar". Bukan turunan custom property CSS
// manapun — `globals.css` tidak punya token navy/dark yang setara; warna ini
// dipilih dengan mata sejak tiket 04 dan di sini sekadar diberi nama, bukan
// dikalibrasi ulang.
const OG_BACKGROUND_NAVY_DARK = '#0c2340'
const OG_BACKGROUND_NAVY_LIGHT = '#1b3f6e'

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

// Fetches Public Sans 700 **woff** (not woff2) from Google Fonts CDN.
// `ImageResponse` in this Next.js version only parses `ttf`/`otf`/`woff` —
// woff2 fails at render time with "Unsupported OpenType signature wOF2"
// (see `node_modules/next/dist/docs/.../image-response.md`). Google's CSS2
// endpoint defaults to woff2 for a modern User-Agent, so getting a `.woff`
// URL back requires an *old*-browser User-Agent, not a Chrome one — a plain
// Chrome UA silently hands you the unsupported format again.
// The font is cached by Next.js after the first generation.
// If this URL becomes stale, get the current one by fetching:
//   https://fonts.googleapis.com/css2?family=Public+Sans:wght@700&display=swap
// with an old-browser User-Agent (e.g. `Mozilla/5.0 (Windows NT 5.1;
// rv:1.9.2.6) Gecko/20100722 Firefox/3.6.6`) and copying the `.woff` src URL.
const fetchFont = async () => {
  const res = await fetch(
    'https://fonts.gstatic.com/s/publicsans/v21/ijwGs572Xtc6ZYQws9YVwllKVG8qX1oyOymu8Z65wA.woff'
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
  const titleFontSize = resolveTitleFontSize(title)
  const displayTitle = truncateTitle(title)

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background:
          mode === 'bergambar'
            ? OG_BACKGROUND_NAVY_DARK
            : `linear-gradient(135deg, ${OG_BACKGROUND_NAVY_LIGHT} 0%, ${OG_BACKGROUND_NAVY_DARK} 100%)`
      }}
    >
      {/* Fotonya tampil apa adanya — tiket 10 mencabut scrim tiket 04.
            Keterbacaan sekarang dijamin oleh plakat opak di bawah, bukan
            oleh menggelapkan foto, jadi tidak ada overlay di atas gambar
            ini sama sekali. */}
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

      {/* Bungkus konten: satu kolom flex, chip terdorong ke atas dan
            kelompok plakat+pil ke bawah lewat `justifyContent: space-between`
            — tanpa ini perlu absolute-position dua elemen dengan tinggi
            yang tidak diketahui di muka (plakat "tinggi mengikuti isi"). */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: '48px 64px 56px'
        }}
      >
        {/* Chip identitas, kiri atas. Sengaja alignSelf flex-start: tanpa
              itu ia ikut stretch selebar kolom induk dan plat putihnya
              membentang penuh kanvas. Struktur tanpa logo hanya menampilkan
              nama — tidak pernah jatuh ke emblem PP atau wordmark
              "KAMMI.id" (bug tiket 02); root `/` mengirim strukturName
              "KAMMI.id" secara eksplisit sebagai satu-satunya pengecualian
              yang sah. */}
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: logoBytes ? '14px' : '0',
            background: '#ffffff',
            borderRadius: '18px',
            padding: logoBytes ? '10px 24px 10px 12px' : '14px 24px'
          }}
        >
          {logoBytes && (
            // eslint-disable-next-line @next/next/no-img-element -- satori JSX rendered by ImageResponse, not a DOM <img>; next/image doesn't apply here.
            <img
              // @ts-expect-error Satori accepts ArrayBuffer for <img src> at runtime.
              src={logoBytes}
              alt=''
              style={{ height: '36px' }}
            />
          )}
          <div
            style={{
              display: 'flex',
              color: '#111827',
              fontSize: '24px',
              fontFamily: 'Public Sans',
              fontWeight: 700
            }}
          >
            {strukturName}
          </div>
        </div>

        {/* Plakat judul + pil tanggal, keduanya di bawah. */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              background: '#ffffff',
              borderRadius: '20px',
              padding: '32px 40px'
            }}
          >
            <div
              style={{
                display: 'flex',
                color: '#111827',
                fontSize: `${titleFontSize}px`,
                fontFamily: 'Public Sans',
                fontWeight: 700,
                lineHeight: 1.15,
                wordBreak: 'break-word',
                marginBottom: subtitle ? '12px' : '0'
              }}
            >
              {displayTitle}
            </div>
            {subtitle && (
              <div
                style={{
                  display: 'flex',
                  color: '#6b7280',
                  fontSize: '28px',
                  fontFamily: 'Public Sans',
                  fontWeight: 700
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {/* Pil merah: hanya tanggal terbit — hanya Permalink Berita
                mengirim `publishedAt`, jadi hanya kartu itu yang punya pil. */}
          {publishedAt && (
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                marginTop: '20px',
                background: OG_PILL_RED,
                borderRadius: '999px',
                padding: '10px 28px',
                color: '#ffffff',
                fontSize: '24px',
                fontFamily: 'Public Sans',
                fontWeight: 700
              }}
            >
              {publishedAt}
            </div>
          )}
        </div>
      </div>
    </div>,
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
