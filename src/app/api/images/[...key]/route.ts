import { storage } from '~/lib/api/storage'

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> }
) => {
  const { key } = await params
  const s3Key = key.join('/')

  try {
    const presignedUrl = await storage.client.file(s3Key).presign({ expiresIn: 86400 })
    const res = await fetch(presignedUrl)
    if (!res.ok) return new Response('Not Found', { status: 404 })
    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') ?? 'application/octet-stream',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new Response('Internal Server Error', { status: 500 })
  }
}
