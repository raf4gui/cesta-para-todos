import { NextResponse } from "next/server"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY
  const auth = process.env.AUTH_SECRET

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: url ? url.slice(0, 30) + "..." : "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon ? anon.slice(0, 20) + "..." : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: svc ? svc.slice(0, 20) + "..." : "MISSING",
    AUTH_SECRET: auth ? auth.slice(0, 10) + "..." : "MISSING",
  })
}
