import { NextResponse } from "next/server"

export async function GET() {
  let results: string[] = []
  let hasError = false

  try {
    const { Client } = await import("pg")
    const rawUrl = process.env.DATABASE_URL!
    const pw = decodeURIComponent(rawUrl.match(/(?<=postgres:)[^@]+/)?.[0] ?? "")
    const ref = rawUrl.match(/(?<=db\.)[a-z]+/)?.[0] ?? ""

    const urls = [
      `postgresql://postgres.${ref}:${encodeURIComponent(pw)}@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=no-verify`,
      `postgresql://postgres.${ref}:${encodeURIComponent(pw)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=no-verify`,
      rawUrl.replace("db.", "aws-0-us-east-1.pooler.") + "?pgbouncer=true",
    ]

    for (const url of urls) {
      try {
        const client = new Client({ connectionString: url, connectionTimeoutMillis: 8000 })
        await client.connect()
        results.push("Connected via: " + url.slice(0, 60) + "...")

        await client.query("alter table baskets drop constraint if exists baskets_tipo_check")
        await client.query(
          "alter table baskets add constraint baskets_tipo_check check (tipo in ('CESTA_PRATICA','CESTA_COMPLETA','CESTAO_FAMILIA','CESTA_PERSONALIZADA','KIT','FARDO'))"
        )
        results.push("Check constraint updated to accept all 6 tipos")

        await client.end()
        break
      } catch (e2: any) {
        results.push("Tried url: " + e2.message.slice(0, 90))
      }
    }
  } catch (e: any) {
    hasError = true
    results.push("Error: " + e.message)
  }

  if (hasError || results.every((r) => r.includes("Tried url") || r.includes("Error"))) {
    results.push("")
    results.push("Apply manually via Supabase Dashboard → SQL Editor:")
    results.push(
      "ALTER TABLE baskets DROP CONSTRAINT IF EXISTS baskets_tipo_check;"
    )
    results.push(
      "ALTER TABLE baskets ADD CONSTRAINT baskets_tipo_check CHECK (tipo IN ('CESTA_PRATICA','CESTA_COMPLETA','CESTAO_FAMILIA','CESTA_PERSONALIZADA','KIT','FARDO'));"
    )
  }

  return NextResponse.json({ success: !hasError, messages: results })
}
