import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

export const AUTH_COOKIE_NAME = "admin_session"

const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60
const AUTH_SECRET = process.env.AUTH_SECRET || `${process.env.ADMIN_USER}:${process.env.ADMIN_PASS}`

function signToken(email: string): string {
  const payload = `${email}:${Date.now()}:${AUTH_SECRET}`
  return Buffer.from(payload).toString("base64")
}

function verifyToken(token: string): { email: string } | null {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const [email, timestamp, secret] = decoded.split(":")
    if (!email || !timestamp || !secret) return null
    if (secret !== AUTH_SECRET) return null
    if (Date.now() - Number(timestamp) > AUTH_COOKIE_MAX_AGE * 1000) return null
    return { email }
  } catch {
    return null
  }
}

export async function createSession(email: string) {
  const cookieStore = await cookies()
  const token = signToken(email)
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)
}

export async function getSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(AUTH_COOKIE_NAME)
  if (!cookie?.value) return null
  return verifyToken(cookie.value)
}

export async function signOut() {
  await destroySession()
  revalidatePath("/", "layout")
}
