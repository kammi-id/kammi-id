'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle
} from '~/components/shadcn/ui/dialog'

interface ImageGalleryGridProps {
  // URL sudah diresolusi pemanggil lewat `resolveSiteImage` (server) — bukan
  // path storage mentah, sama seperti Gambar Utama di halaman yang sama.
  images: string[]
  articleTitle: string
}

// Dipakai berita (`[strukturSlug]/berita/.../[slug]`) dan Halaman
// (`[strukturSlug]/[slug]`) — generik dan lintas-rute, memenuhi ambang
// promosi ke `src/components/` (AGENTS.md).
export const ImageGalleryGrid = ({
  images,
  articleTitle
}: ImageGalleryGridProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (images.length === 0) return null

  return (
    <div className='mt-10'>
      <h2 className='text-muted-foreground mb-4 text-sm font-semibold tracking-wide uppercase'>
        Galeri
      </h2>
      <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4'>
        {images.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type='button'
            onClick={() => setOpenIndex(index)}
            className='bg-muted aspect-square overflow-hidden rounded-lg'
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- thumbnail tanpa dimensi tetap */}
            <img
              src={url}
              alt={`${articleTitle} — galeri ${index + 1}`}
              className='h-full w-full object-cover transition-transform hover:scale-105'
            />
          </button>
        ))}
      </div>

      <Dialog
        open={openIndex !== null}
        onOpenChange={(open) => {
          if (!open) setOpenIndex(null)
        }}
      >
        <DialogContent className='max-w-3xl border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-3xl'>
          <DialogTitle className='sr-only'>
            {articleTitle} — galeri {openIndex !== null ? openIndex + 1 : ''}
          </DialogTitle>
          {openIndex !== null && (
            // eslint-disable-next-line @next/next/no-img-element -- gambar penuh tanpa dimensi tetap
            <img
              src={images[openIndex]}
              alt={`${articleTitle} — galeri ${openIndex + 1}`}
              className='max-h-[85vh] w-full rounded-2xl object-contain'
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
