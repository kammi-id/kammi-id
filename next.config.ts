import type { NextConfig } from 'next'

const allowedImageHostnames = (
  process.env.NEXT_IMAGE_ALLOWED_HOSTNAMES ?? 'picsum.photos,images.unsplash.com'
)
  .split(',')
  .map((h) => h.trim())
  .filter(Boolean)

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
    remotePatterns: allowedImageHostnames.map((hostname) => ({
      protocol: 'https' as const,
      hostname
    }))
  }
}

export default nextConfig
