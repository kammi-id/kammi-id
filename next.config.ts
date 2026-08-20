import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
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
