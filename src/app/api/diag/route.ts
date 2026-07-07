import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY

  const results: Record<string, any> = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url ? url.slice(0, 30) + "..." : "MISSING",
      SUPABASE_SERVICE_ROLE_KEY: svc ? svc.slice(0, 15) + "..." : "MISSING",
    },
  }

  // Test query
  try {
    const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data, error } = await sb
      .from("baskets")
      .select("id, name, tipo")
      .eq("ativo", true)
      .limit(3)

    results.query = {
      success: !error,
      data: error ? null : JSON.parse(JSON.stringify(data)),
      error: error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null,
    }
  } catch (e: any) {
    results.query = { success: false, error: { message: e.message } }
  }

  return NextResponse.json(results)
}
