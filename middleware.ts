import { NextRequest, NextResponse } from 'next/server'
import { decodeTokenPayload, COOKIE_NAME } from '@/lib/jwt-edge'

const PROTECTED = ['/search', '/graph', '/profile', '/import', '/reminders']
const AUTH_ONLY = ['/login', '/register'] // redirect logged-in users away from these
const ADMIN_ROUTES = ['/admin']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(COOKIE_NAME)?.value ?? null

  // Decode without verifying — full cryptographic verification happens in each API route.
  // Middleware is for routing only; it does not grant data access.
  const tokenPayload = token ? decodeTokenPayload(token) : null
  const isAuthenticated = tokenPayload !== null
  const isGuest = req.cookies.get('nm_guest')?.value === '1'

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  const isAuthPage = AUTH_ONLY.some((p) => pathname.startsWith(p))
  const isAdminRoute = ADMIN_ROUTES.some((p) => pathname.startsWith(p))

  if (isAdminRoute && !tokenPayload?.isAdmin) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isProtected && !isAuthenticated && !isGuest) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPage && isAuthenticated) {
    const url = req.nextUrl.clone()
    url.pathname = '/search'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/search/:path*', '/graph/:path*', '/profile/:path*', '/import/:path*', '/reminders/:path*', '/reminders', '/login', '/register', '/admin/:path*', '/admin'],
}
