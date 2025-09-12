import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Allow dev tunnels for Server Actions
  const requestHeaders = new Headers(request.headers)
  
  // Get the forwarded host from dev tunnels
  const forwardedHost = requestHeaders.get('x-forwarded-host')
  
  if (forwardedHost && forwardedHost.includes('devtunnels.ms')) {
    // Create a new response
    const response = NextResponse.next()
    
    // Set headers to allow the dev tunnel
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}