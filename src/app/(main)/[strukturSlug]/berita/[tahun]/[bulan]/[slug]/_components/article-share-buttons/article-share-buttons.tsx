'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Copy01Icon,
  Facebook02Icon,
  NewTwitterIcon,
  Share01Icon,
  TelegramIcon,
  ThreadsIcon,
  WhatsappIcon
} from '@hugeicons/core-free-icons'
import { Button } from '~/components/shadcn/ui/button'

type ArticleShareButtonsProps = {
  title: string
}

type ShareChannel = {
  name: string
  icon: IconSvgElement
  buildIntentUrl: (title: string, url: string) => string
}

// Skema intent-URL untuk tiap kanal — permukaan yang paling mungkin berubah
// tanpa pengumuman resmi (khususnya Threads, lihat tiket 09).
const SHARE_CHANNELS: ShareChannel[] = [
  {
    name: 'WhatsApp',
    icon: WhatsappIcon,
    buildIntentUrl: (title, url) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
  },
  {
    name: 'X',
    icon: NewTwitterIcon,
    buildIntentUrl: (title, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  },
  {
    name: 'Facebook',
    icon: Facebook02Icon,
    buildIntentUrl: (_title, url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  },
  {
    name: 'Telegram',
    icon: TelegramIcon,
    buildIntentUrl: (title, url) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  },
  {
    name: 'Threads',
    icon: ThreadsIcon,
    buildIntentUrl: (title, url) =>
      `https://www.threads.net/intent/post?text=${encodeURIComponent(`${title} ${url}`)}`
  }
]

const isWebShareAvailable = () =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function'

/**
 * Baris tombol bagikan di halaman Permalink Berita (tiket 09). Berbeda dari
 * kartu OG (tiket 04) yang cuma dilihat lewat pratinjau tautan orang lain —
 * ini yang dipakai pembaca untuk *memulai* membagikan.
 *
 * URL diambil dari `window.location.href` saat tombol diklik, bukan disimpan
 * di state — `page.tsx` hanya pernah merender komponen ini pada path
 * kanonik (`outcome.kind === 'ok'`), jadi href saat itu selalu benar.
 *
 * Deteksi Web Share API sengaja ditunda ke `useEffect` (bukan dihitung saat
 * render pertama): `navigator` tidak ada di server, jadi menghitungnya
 * langsung saat render akan selalu jatuh ke cabang "tidak tersedia" saat SSR
 * dan bisa mismatch dengan client yang mendukungnya.
 */
export const ArticleShareButtons = ({ title }: ArticleShareButtonsProps) => {
  const [canUseWebShare, setCanUseWebShare] = useState(false)

  useEffect(() => {
    setCanUseWebShare(isWebShareAvailable())
  }, [])

  const handleWebShare = useCallback(async () => {
    try {
      await navigator.share({ title, url: window.location.href })
    } catch {
      // Dibatalkan pengguna (AbortError) atau kegagalan lain — ditelan diam-diam,
      // bukan dilempar sebagai error. Tidak ada pelacakan klik di proyek ini.
    }
  }, [title])

  const handleChannelClick = useCallback(
    (channel: ShareChannel) => {
      const intentUrl = channel.buildIntentUrl(title, window.location.href)
      window.open(intentUrl, '_blank', 'noopener,noreferrer')
    },
    [title]
  )

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Tautan disalin.')
    } catch {
      toast.error('Gagal menyalin tautan.')
    }
  }, [])

  return (
    <div
      role='group'
      aria-label='Bagikan Berita ini'
      className='mt-4 flex flex-wrap items-center gap-2'
    >
      {canUseWebShare ? (
        <Button type='button' variant='outline' size='sm' onClick={handleWebShare}>
          <HugeiconsIcon icon={Share01Icon} strokeWidth={2} data-icon='inline-start' />
          Bagikan
        </Button>
      ) : (
        <>
          {SHARE_CHANNELS.map((channel) => (
            <Button
              key={channel.name}
              type='button'
              variant='outline'
              size='icon-sm'
              aria-label={`Bagikan ke ${channel.name}`}
              onClick={() => handleChannelClick(channel)}
            >
              <HugeiconsIcon icon={channel.icon} strokeWidth={2} />
            </Button>
          ))}
          <Button
            type='button'
            variant='outline'
            size='icon-sm'
            aria-label='Salin Tautan'
            onClick={handleCopyLink}
          >
            <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
          </Button>
        </>
      )}
    </div>
  )
}
