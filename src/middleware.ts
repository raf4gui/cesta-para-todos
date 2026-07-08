import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_COOKIE = "admin_session"
const AUTH_MAX_AGE = 7 * 24 * 60 * 60 * 1000
const AUTH_SECRET = process.env.AUTH_SECRET || `${process.env.ADMIN_USER}:${process.env.ADMIN_PASS}`

function verifyToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const parts = decoded.split(":")
    if (parts.length < 3) return false
    const [email, timestamp, secret] = parts
    if (!email || !timestamp || !secret) return false
    if (secret !== AUTH_SECRET) return false
    if (Date.now() - Number(timestamp) > AUTH_MAX_AGE) return false
    return true
  } catch {
    return false
  }
}

function buildSecurityHeaders() {
  const isDev = process.env.NODE_ENV === "development"
  const scriptSrc = `'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`
  return {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy":
      `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src 'none'; object-src 'none'`,
  }
}

function addSecurityHeaders(response: NextResponse, pathname: string) {
  const headers = buildSecurityHeaders()
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  if (!pathname.startsWith("/_next") && !pathname.includes(".")) {
    response.headers.set("Cache-Control", "private, no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
  }
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response: NextResponse

  if (pathname.startsWith("/admin")) {
    const cookie = request.cookies.get(AUTH_COOKIE)?.value
    const isAuthenticated = cookie ? verifyToken(cookie) : false
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      response = NextResponse.redirect(loginUrl)
    } else {
      response = NextResponse.next()
    }
  } else if (pathname === "/login") {
    const cookie = request.cookies.get(AUTH_COOKIE)?.value
    const isAuthenticated = cookie ? verifyToken(cookie) : false
    if (isAuthenticated) {
      response = NextResponse.redirect(new URL("/admin", request.url))
    } else {
      response = NextResponse.next()
    }
  } else {
    response = NextResponse.next()
  }

  addSecurityHeaders(response, pathname)
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
