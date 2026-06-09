import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  cacheComponents: true,
  reactCompiler: true,
  experimental: {
    viewTransition: true,
    serverActions: {
      bodySizeLimit: '50mb'
    },
    proxyClientMaxBodySize: '50mb'
  },
  images: {
    localPatterns: [{ pathname: '/api/images/**', search: '' }],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.kammi.id'
      }
    ],
    qualities: [75]
  }
}

export default nextConfig
