import { NextRequest } from 'next/server'

export const GET = (req: NextRequest) => {
  const token = req.headers.get('x-ci-token')
  const expected = process.env.CI_HEALTH_TOKEN

  if (!expected || token !== expected) {
    return new Response(null, { status: 404 })
  }

  return new Response('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  })
}
