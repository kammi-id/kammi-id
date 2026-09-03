import '@testing-library/jest-dom'
import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'

import { ArticleShareButtons } from './article-share-buttons'

afterEach(cleanup)

const TITLE = 'Kader KAMMI turun aksi'
const URL = 'https://kammi.id/pk-test/berita/2026/09/kader-kammi-turun-aksi'

const setLocation = () => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, href: URL }
  })
}

// `navigator.share` tidak ada secara asali di happy-dom (mengikuti dukungan
// nyata di banyak browser) — dites lewat `Object.defineProperty` yang bisa
// dihapus lagi per test, alih-alih mengandalkan implementasi bawaan.
const defineWebShare = (impl: (data: unknown) => Promise<void>) => {
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: mock(impl)
  })
}

const removeWebShare = () => {
  // @ts-expect-error -- properti opsional yang sengaja dihapus untuk uji "tidak tersedia"
  delete navigator.share
}

beforeEach(() => {
  setLocation()
  removeWebShare()
})

afterEach(() => {
  removeWebShare()
})

describe('ArticleShareButtons — Web Share tersedia', () => {
  test('klik "Bagikan" memanggil navigator.share dengan title dan url saat ini', async () => {
    const share = mock(() => Promise.resolve())
    defineWebShare(share)
    const user = userEvent.setup()

    render(<ArticleShareButtons title={TITLE} />)

    const button = await screen.findByRole('button', { name: 'Bagikan' })
    await user.click(button)

    expect(share).toHaveBeenCalledWith({ title: TITLE, url: URL })
  })

  test('AbortError (pembatalan pengguna) ditelan diam-diam, tidak dilempar', async () => {
    const abortError = Object.assign(new Error('cancelled'), {
      name: 'AbortError'
    })
    defineWebShare(() => Promise.reject(abortError))
    const user = userEvent.setup()

    render(<ArticleShareButtons title={TITLE} />)

    const button = await screen.findByRole('button', { name: 'Bagikan' })
    // Tidak boleh melempar / meng-crash komponen.
    await expect(user.click(button)).resolves.toBeUndefined()
  })
})

describe('ArticleShareButtons — Web Share tidak tersedia', () => {
  test('merender baris ikon kanal, bukan tombol Bagikan', () => {
    render(<ArticleShareButtons title={TITLE} />)

    expect(
      screen.queryByRole('button', { name: 'Bagikan' })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Bagikan ke WhatsApp' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Bagikan ke X' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Bagikan ke Facebook' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Bagikan ke Telegram' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Bagikan ke Threads' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Salin Tautan' })
    ).toBeInTheDocument()
  })

  test('WhatsApp membuka intent-URL resminya di tab baru', async () => {
    const open = spyOn(window, 'open').mockImplementation(() => null)
    const user = userEvent.setup()

    render(<ArticleShareButtons title={TITLE} />)
    await user.click(screen.getByRole('button', { name: 'Bagikan ke WhatsApp' }))

    expect(open).toHaveBeenCalledWith(
      `https://wa.me/?text=${encodeURIComponent(`${TITLE} ${URL}`)}`,
      '_blank',
      'noopener,noreferrer'
    )
    open.mockRestore()
  })

  test('X membuka intent-URL resminya di tab baru', async () => {
    const open = spyOn(window, 'open').mockImplementation(() => null)
    const user = userEvent.setup()

    render(<ArticleShareButtons title={TITLE} />)
    await user.click(screen.getByRole('button', { name: 'Bagikan ke X' }))

    expect(open).toHaveBeenCalledWith(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(TITLE)}&url=${encodeURIComponent(URL)}`,
      '_blank',
      'noopener,noreferrer'
    )
    open.mockRestore()
  })

  test('Facebook membuka intent-URL resminya di tab baru', async () => {
    const open = spyOn(window, 'open').mockImplementation(() => null)
    const user = userEvent.setup()

    render(<ArticleShareButtons title={TITLE} />)
    await user.click(screen.getByRole('button', { name: 'Bagikan ke Facebook' }))

    expect(open).toHaveBeenCalledWith(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL)}`,
      '_blank',
      'noopener,noreferrer'
    )
    open.mockRestore()
  })

  test('Telegram membuka intent-URL resminya di tab baru', async () => {
    const open = spyOn(window, 'open').mockImplementation(() => null)
    const user = userEvent.setup()

    render(<ArticleShareButtons title={TITLE} />)
    await user.click(screen.getByRole('button', { name: 'Bagikan ke Telegram' }))

    expect(open).toHaveBeenCalledWith(
      `https://t.me/share/url?url=${encodeURIComponent(URL)}&text=${encodeURIComponent(TITLE)}`,
      '_blank',
      'noopener,noreferrer'
    )
    open.mockRestore()
  })

  test('Threads membuka intent-URL resminya di tab baru', async () => {
    const open = spyOn(window, 'open').mockImplementation(() => null)
    const user = userEvent.setup()

    render(<ArticleShareButtons title={TITLE} />)
    await user.click(screen.getByRole('button', { name: 'Bagikan ke Threads' }))

    expect(open).toHaveBeenCalledWith(
      `https://www.threads.net/intent/post?text=${encodeURIComponent(`${TITLE} ${URL}`)}`,
      '_blank',
      'noopener,noreferrer'
    )
    open.mockRestore()
  })

  test('Salin Tautan menulis ke clipboard dan menampilkan toast.success', async () => {
    const writeText = spyOn(navigator.clipboard, 'writeText').mockResolvedValue(
      undefined
    )
    const toastSuccess = spyOn(toast, 'success').mockImplementation(
      () => 'toast-id'
    )
    const user = userEvent.setup()

    render(<ArticleShareButtons title={TITLE} />)
    await user.click(screen.getByRole('button', { name: 'Salin Tautan' }))

    expect(writeText).toHaveBeenCalledWith(URL)
    expect(toastSuccess).toHaveBeenCalledWith('Tautan disalin.')

    writeText.mockRestore()
    toastSuccess.mockRestore()
  })
})
