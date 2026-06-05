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
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.kammi.id'
      }
    ]
  }
}

export default nextConfig
