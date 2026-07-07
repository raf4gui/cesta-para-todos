import { NextResponse } from "next/server"
import { createSession, destroySession } from "@/lib/auth"
import { loginLimiter } from "@/lib/rate-limiter"

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"

    const rateCheck = loginLimiter.check(ip)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em 15 minutos." },
        { status: 429 },
      )
    }

    const { email, password } = await request.json()

    if (
      email !== process.env.ADMIN_USER ||
      password !== process.env.ADMIN_PASS
    ) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 },
      )
    }

    await createSession(email)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function DELETE() {
  await destroySession()
  return NextResponse.json({ ok: true })
}
