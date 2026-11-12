import { NextRequest, NextResponse } from 'next/server'

/** Preview and staging hosts are useful for QA, but are not separate search properties. */
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  // nextUrl can contain the internal deployment hostname behind a reverse proxy.
  const host = (request.headers.get('host') || request.nextUrl.hostname).split(':')[0].toLowerCase()
  if (!['glowroute.io', 'www.glowroute.io'].includes(host)) {
    response.headers.set('X-Robots-Tag', 'noindex, follow')
  }
  return response
}

export const config = { matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'] }
