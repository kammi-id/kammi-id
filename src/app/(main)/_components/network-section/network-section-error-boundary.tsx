'use client'

// Next.js 16 component-level error boundary API.
// Catches runtime errors from NetworkSectionClient (e.g. Leaflet init failures,
// dynamic import errors) and renders a graceful fallback with a retry option.
import type { ReactNode } from 'react'
import { unstable_catchError as catchError, type ErrorInfo } from 'next/error'

// Props must include children so React can forward them through the boundary
interface BoundaryProps {
  children?: ReactNode
}

const NetworkClientFallback = (
  _props: BoundaryProps,
  { unstable_retry }: ErrorInfo
) => (
  <section
    className='bg-background border-border relative flex h-dvh max-h-dvh flex-col items-center justify-center gap-4 border-t'
    aria-label='Peta Jaringan tidak tersedia'
  >
    <svg
      className='text-muted-foreground/40 size-12'
      viewBox='0 0 24 24'
      fill='none'
      aria-hidden='true'
    >
      <path
        d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
    <p className='text-muted-foreground font-sans text-sm'>
      Peta jaringan tidak dapat dimuat
    </p>
    <button
      onClick={() => unstable_retry()}
      className='text-primary hover:text-primary/80 font-sans text-sm font-semibold transition-colors'
    >
      Coba lagi
    </button>
  </section>
)

export const NetworkSectionErrorBoundary = catchError(NetworkClientFallback)
