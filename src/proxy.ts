import { NextResponse, NextRequest } from 'next/server'
import { readActiveSession } from '~/lib/auth/cookies'

export const config = {
  matcher: '/dashboard/:path*'
}

export async function proxy(request: NextRequest) {
  const session = await readActiveSession()

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { pathname } = request.nextUrl

  const adminPaths = [
    '/dashboard/members',
    '/dashboard/alumni',
    '/dashboard/pemandu',
    '/dashboard/instruktur',
    '/dashboard/branches'
  ]
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path))

  if (isAdminPath && session.user.role === 'member') {
    return NextResponse.redirect(
      new URL('/dashboard?error=unauthorized', request.url)
    )
  }
}
