import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/jwt'

const PROTECTED = ['/search', '/graph', '/profile', '/import']
const AUTH_ONLY = ['/login', '/register'] // redirect logged-in users away from these

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(COOKIE_NAME)?.value ?? null

  let isAuthenticated = false
  if (token) {
    try {
      await verifyToken(token)
      isAuthenticated = true
    } catch {
      isAuthenticated = false
    }
  }

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  const isAuthPage = AUTH_ONLY.some((p) => pathname.startsWith(p))

  if (isProtected && !isAuthenticated) {
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
  matcher: ['/search/:path*', '/graph/:path*', '/profile/:path*', '/import/:path*', '/login', '/register'],
}
