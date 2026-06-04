import { getNetworkStats, getPWOrganizations } from '~/app/(main)/_data/network'
import { NetworkSectionClient } from './network-section-client'
import { NetworkSectionErrorBoundary } from './network-section-error-boundary'

// ── RSC-level fallback ────────────────────────────────────────────────────────
// Shown when the DB query fails (e.g. connection error). Keeps the visual
// layout consistent without crashing the whole page.
const NetworkSectionDataFallback = () => (
  <section
    className='bg-background border-border relative flex h-dvh max-h-dvh flex-col items-center justify-center gap-3 border-t'
    aria-labelledby='network-fallback-heading'
  >
    <p
      id='network-fallback-heading'
      className='text-muted-foreground font-sans text-sm'
    >
      Data jaringan tidak tersedia saat ini
    </p>
  </section>
)

// ── RSC wrapper ───────────────────────────────────────────────────────────────
export const NetworkSection = async () => {
  let stats: Awaited<ReturnType<typeof getNetworkStats>>
  let pwOrgs: Awaited<ReturnType<typeof getPWOrganizations>>

  try {
    ;[stats, pwOrgs] = await Promise.all([
      getNetworkStats(),
      getPWOrganizations()
    ])
  } catch {
    // DB unavailable — render graceful fallback instead of crashing the page
    return <NetworkSectionDataFallback />
  }

  return (
    // Client-side error boundary: catches Leaflet / dynamic-import runtime errors
    <NetworkSectionErrorBoundary>
      <NetworkSectionClient stats={stats} pwOrgs={pwOrgs} />
    </NetworkSectionErrorBoundary>
  )
}
