import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Next's own internal type-check duplicates `check:types` (a separate CI
  // gate that `build-push` already depends on via `needs: test`), and its
  // Linux-only worker fails on files that plain `tsc --noEmit` passes clean
  // — it crashed the Docker build outright rather than reporting a real
  // defect. The one gate that matters (`check:types`) still runs and still
  // blocks the pipeline on a genuine type error.
  typescript: { ignoreBuildErrors: true },
  cacheComponents: true,
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    },
    proxyClientMaxBodySize: '50mb'
  },
  images: {
    localPatterns: [{ pathname: '/api/images/**', search: '' }],
    qualities: [75],
    minimumCacheTTL: 2678400
  }
}

export default nextConfig
