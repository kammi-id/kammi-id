import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import z from 'zod'

const protectedRoutes = ['/dashboard']
const authRoutes = ['/login']

export const proxy = async (req: NextRequest) => {
  const isProtected = protectedRoutes.includes(req.nextUrl.pathname)
  const isAuth = authRoutes.includes(req.nextUrl.pathname)

  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('kammi-id-session')?.value

  let response = NextResponse.next()

  if (!sessionToken) {
    if (isProtected) {
      response = NextResponse.redirect(new URL('/login', req.nextUrl.origin))
    }
  } else {
    const [sessionId, sessionSecret] = sessionToken.split('.')
    const isMalformed = !sessionId || !sessionSecret

    if (isMalformed) {
      cookieStore.delete('kammi-id-session')
    } else {
      const validSession = z
        .object({
          sessionId: z.uuidv7(),
          sessionSecret: z.uuidv4()
        })
        .safeParse({ sessionId, sessionSecret })

      if (!validSession.success) {
        cookieStore.delete('kammi-id-session')
        if (isProtected) {
          response = NextResponse.redirect(
            new URL('/login', req.nextUrl.origin)
          )
        }
      } else if (isAuth) {
        response = NextResponse.redirect(
          new URL('/dashboard', req.nextUrl.origin)
        )
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
}
