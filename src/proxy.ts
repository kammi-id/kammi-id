import { redirect } from 'next/navigation'
import { readActiveSession } from '~/lib/auth/cookies'

export const proxy = {
  matcher: '/dashboard/:path*',
  async handle() {
    const session = await readActiveSession()

    if (!session) {
      redirect('/login')
    }

    const { pathname } = await this.request.nextUrl

    const adminPaths = ['/dashboard/members', '/dashboard/branches']
    const isAdminPath = adminPaths.some((path) => pathname.startsWith(path))

    if (isAdminPath && session.user.role === 'member') {
      redirect('/dashboard?error=unauthorized')
    }
  },
}
