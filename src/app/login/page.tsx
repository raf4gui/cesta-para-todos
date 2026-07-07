"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f7f0] to-[#e0ebe0]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-[#dfe7dd]"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#102016]">Cesta para Todos</h1>
          <p className="text-sm text-[#526157] mt-1">Acesso Administrativo</p>
        </div>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            {error}
          </div>
        )}
        <label className="block text-sm font-medium text-[#102016] mb-1">
          E-mail
        </label>
        <input
          className="w-full border border-[#dfe7dd] bg-white text-[#102016] rounded-lg p-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-[#006B2E] focus:border-transparent"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cesta@paratodos"
          required
        />
        <label className="block text-sm font-medium text-[#102016] mb-1">
          Senha
        </label>
        <input
          type="password"
          className="w-full border border-[#dfe7dd] bg-white text-[#102016] rounded-lg p-2.5 mb-6 focus:outline-none focus:ring-2 focus:ring-[#006B2E] focus:border-transparent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#006B2E] text-white py-2.5 rounded-lg font-medium hover:bg-[#005324] transition-colors disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  )
}
