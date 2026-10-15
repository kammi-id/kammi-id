'use client'

import { useCallback, useEffect, useRef } from 'react'
import { Button } from '~/components/shadcn/ui/button'
import { Spinner } from '~/components/shadcn/ui/spinner'

interface MembersLoadMoreProps {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
}

/**
 * The infinite-scroll trigger for Daftar Struktur (tiket 06) — a sentinel an
 * `IntersectionObserver` watches, **and** a "Muat lagi" button that is always
 * rendered alongside it, not swapped in only when the observer fails.
 *
 * The button is the one path that reaches the last batch for a keyboard user
 * (a sentinel entering the viewport is not a keyboard event) and for
 * `prefers-reduced-motion`, where a user may have disabled the kind of
 * continuous scrolling that would otherwise carry the sentinel into view.
 * Both triggers call the same `onLoadMore` — there is exactly one way a
 * batch gets appended, just two ways to ask for it.
 */
export const MembersLoadMore = ({
  hasMore,
  isLoading,
  onLoadMore
}: MembersLoadMoreProps) => {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const doneMessageRef = useRef<HTMLParagraphElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  // true tepat sebelum `hasMore` pertama kali jadi false — dipakai untuk
  // membedakan "baru saja habis karena batch terakhir dimuat" dari "sudah
  // habis sejak render pertama" (hasil pencarian yang sempit, misalnya).
  const wasLoadingLastBatchRef = useRef(false)

  // Disimpan lewat effect, bukan ditulis langsung selama render — menulis
  // `.current` di badan render membuat React tidak tahu bacaan mana yang
  // konsisten dengan render mana (react-hooks/refs).
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  })

  // Satu pintu untuk kedua pemicu (sentinel & tombol) — supaya keduanya
  // sama-sama menandai wasLoadingLastBatchRef sebelum memanggil onLoadMore,
  // bukan cuma salah satunya.
  const handleTrigger = useCallback(() => {
    wasLoadingLastBatchRef.current = true
    onLoadMoreRef.current()
  }, [])

  useEffect(() => {
    if (!hasMore) return

    const sentinel = sentinelRef.current
    if (!sentinel) return
    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          handleTrigger()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, handleTrigger])

  // Tombol "Muat lagi" hilang dari DOM tepat saat batch terakhir tiba —
  // fokus keyboard yang sedang di atasnya akan jatuh ke <body> kalau
  // dibiarkan. Pindahkan ke pesan penutup, tapi hanya saat transisinya
  // dipicu pemuatan (bukan saat render pertama sudah langsung habis).
  useEffect(() => {
    if (hasMore) return
    if (!wasLoadingLastBatchRef.current) return
    wasLoadingLastBatchRef.current = false
    doneMessageRef.current?.focus()
  }, [hasMore])

  if (!hasMore) {
    return (
      <p
        ref={doneMessageRef}
        role='status'
        tabIndex={-1}
        className='text-muted-foreground py-4 text-center text-sm outline-none'
      >
        Semua organisasi sudah ditampilkan.
      </p>
    )
  }

  return (
    <div className='flex flex-col items-center gap-3 py-4'>
      <div ref={sentinelRef} aria-hidden='true' className='h-px w-full' />
      <Button
        type='button'
        variant='outline'
        size='sm'
        onClick={handleTrigger}
        disabled={isLoading}
        aria-label='Muat organisasi berikutnya'
      >
        {isLoading ? (
          <>
            <Spinner data-icon='inline-start' />
            Memuat...
          </>
        ) : (
          'Muat lagi'
        )}
      </Button>
      <span role='status' aria-live='polite' className='sr-only'>
        {isLoading ? 'Memuat organisasi berikutnya' : ''}
      </span>
    </div>
  )
}
