import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'
import { NextRequest } from 'next/server'

export const config = {
  matcher: '/dashboard/:path*',
}

export async function proxy(request: NextRequest) {
  const session = await readActiveSession()

  if (!session) {
    redirect('/login')
  }

  const { pathname } = request.nextUrl

  const adminPaths = ['/dashboard/members', '/dashboard/branches']
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path))

  if (isAdminPath && session.user.role === 'member') {
    redirect('/dashboard?error=unauthorized')
  }
}
