import type { ReactNode } from 'react'

type InactiveStrukturPermalinkFrameProps = {
  children: ReactNode
  organizationName: string
}

/**
 * ADR 0013's archive-only frame. It intentionally exposes no internal site
 * navigation: every navigable route of this Struktur answers not-found.
 */
export const InactiveStrukturPermalinkFrame = ({
  children,
  organizationName
}: InactiveStrukturPermalinkFrameProps) => (
  <div className='bg-background min-h-screen'>
    <header className='border-border/60 mx-auto max-w-3xl border-b px-6 py-5 lg:px-8'>
      <p className='font-heading text-foreground text-lg font-semibold'>
        {organizationName}
      </p>
      <p className='text-muted-foreground mt-1 text-sm'>
        Kepengurusan Struktur ini sedang tidak berjalan. Berita ini tetap
        tersedia sebagai arsip.
      </p>
      <a
        href='https://kammi.id'
        className='text-primary mt-3 inline-flex text-sm font-semibold underline underline-offset-4'
      >
        Kunjungi kammi.id
      </a>
    </header>
    {children}
  </div>
)
