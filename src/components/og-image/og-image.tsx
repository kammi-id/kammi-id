import { ImageResponse } from 'next/og'

export const ogImageConfig = {
  size: { width: 1200, height: 630 },
  contentType: 'image/png' as const,
}

type OgImageProps = {
  title: string
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

export const ogImage = async ({ title, subtitle }: OgImageProps) => {
  const fontData = await fetchFont()

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1b3f6e 0%, #0c2340 100%)',
          padding: '64px 80px',
          justifyContent: 'flex-end',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: 'rgba(255,255,255,0.45)',
            fontSize: '18px',
            fontFamily: 'Public Sans',
            letterSpacing: '6px',
            textTransform: 'uppercase',
            marginBottom: '28px',
          }}
        >
          KAMMI.id
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: '80px',
            fontFamily: 'Public Sans',
            fontWeight: 700,
            lineHeight: 1.05,
            marginBottom: subtitle ? '20px' : '0',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '30px',
              fontFamily: 'Public Sans',
              fontWeight: 400,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    ),
    {
      ...ogImageConfig.size,
      fonts: [
        {
          name: 'Public Sans',
          data: fontData,
          weight: 700,
          style: 'normal',
        },
      ],
    }
  )
}
