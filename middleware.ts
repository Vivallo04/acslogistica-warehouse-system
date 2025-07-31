import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateAuthFromCookies } from '@/lib/server-auth'

// Define protected routes that require authentication
const PROTECTED_ROUTES = [
  '/',
  '/recibidor-miami',
  '/dashboard'
]

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/unauthorized',
  '/pending-approval',
  '/preregistro',
  '/not-found',
  '/api/health' // Health check should remain public
]

// Static assets and Next.js internals that should be ignored
const IGNORED_PATHS = [
  '/_next',
  '/favicon.ico',
  '/api/_next',
  '/__nextjs',
  '/static'
]

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => {
    // Exact match
    if (pathname === route) return true
    // Match with trailing slash to ensure it's a proper sub-route
    if (pathname.startsWith(route + '/')) return true
    return false
  })
}

function isProtectedRoute(pathname: string): boolean {
  return matchesRoute(pathname, PROTECTED_ROUTES)
}

function isPublicRoute(pathname: string): boolean {
  return matchesRoute(pathname, PUBLIC_ROUTES)
}

function shouldIgnorePath(pathname: string): boolean {
  return IGNORED_PATHS.some(path => pathname.startsWith(path)) ||
         pathname.includes('.') // Ignore file requests
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for ignored paths
  if (shouldIgnorePath(pathname)) {
    return NextResponse.next()
  }

  // Allow public routes without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  if (isProtectedRoute(pathname)) {
    const authResult = await validateAuthFromCookies(request)
    
    if (!authResult.valid) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] Unauthorized access attempt to ${pathname}: ${authResult.error}`)
      }
      
      // Redirect to login page with return URL
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('returnUrl', pathname)
      
      return NextResponse.redirect(loginUrl)
    }

    // User is authenticated, allow access
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] Authorized access to ${pathname} by ${authResult.user?.email}`)
    }
    return NextResponse.next()
  }

  // For undefined routes, default to protected (secure by default)
  // This ensures any new routes require explicit classification to avoid accidental exposure
  const authResult = await validateAuthFromCookies(request)
  
  if (!authResult.valid) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] Unauthorized access to undefined route ${pathname}: ${authResult.error}`)
    }
    
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[MIDDLEWARE] Authorized access to undefined route ${pathname} by ${authResult.user?.email}`)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}