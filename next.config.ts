import type { NextConfig } from 'next'

const s3Hostname = (() => {
  try {
    const endpoint = process.env.S3_ENDPOINT
    if (!endpoint) return null
    return new URL(endpoint).hostname
  } catch {
    return null
  }
})()

const allowedImageHostnames = [
  ...(process.env.NEXT_IMAGE_ALLOWED_HOSTNAMES ?? 'picsum.photos,images.unsplash.com')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean),
  ...(s3Hostname ? [s3Hostname] : [])
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
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
