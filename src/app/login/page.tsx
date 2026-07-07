"use client"

import { useState, useId } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Mail, Lock, LogIn, Loader2, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const emailId = useId()
  const passwordId = useId()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/login/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 429) {
          setError("Muitas tentativas. Tente novamente em 15 minutos.")
        } else {
          setError(data.error || "Credenciais inválidas")
        }
        return
      }

      const searchParams = new URLSearchParams(window.location.search)
      router.push(searchParams.get("redirect") || "/admin")
    } catch {
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#dcebdc] via-[#eef7f0] to-[#f6faf6] px-4">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#006B2E]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#FF6A00]/5 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#006B2E]/[0.03] blur-2xl" />

      <div className="relative w-full max-w-[420px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#dfe7dd] bg-white/95 p-8 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:p-10"
        >
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="relative h-20 w-56">
              <Image
                src="/WheelSexta.png"
                alt="Cesta para Todos"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-xl font-extrabold tracking-tight text-[#102016]">
              Painel Administrativo
            </h1>
            <p className="mt-1 text-sm font-medium text-[#8c9c91]">
              Acesso restrito.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Email field */}
          <div className="mb-5">
            <label
              htmlFor={emailId}
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#526157]"
            >
              E-mail
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c9c91]" />
              <input
                id={emailId}
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cesta@paratodos"
                required
                className="h-11 w-full rounded-xl border border-[#dfe7dd] bg-white pl-10 pr-4 text-sm font-medium text-[#102016] placeholder:text-[#bcc9bf] outline-none transition-all focus:border-[#006B2E] focus:ring-2 focus:ring-[#006B2E]/20"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="mb-6">
            <label
              htmlFor={passwordId}
              className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#526157]"
            >
              Senha
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c9c91]" />
              <input
                id={passwordId}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 w-full rounded-xl border border-[#dfe7dd] bg-white pl-10 pr-4 text-sm font-medium text-[#102016] placeholder:text-[#bcc9bf] outline-none transition-all focus:border-[#006B2E] focus:ring-2 focus:ring-[#006B2E]/20"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#006B2E] text-sm font-extrabold text-white shadow-[0_4px_14px_rgba(0,107,46,0.25)] transition-all hover:bg-[#005324] hover:shadow-[0_6px_20px_rgba(0,107,46,0.35)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Entrando...</span>
              </>
            ) : (
              <>
                <LogIn className="h-5 w-5" />
                <span>Entrar</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="mt-6 text-center text-xs font-medium text-[#8c9c91]">
          &copy; {new Date().getFullYear()} Cesta para Todos. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
