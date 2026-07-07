"use client"

import { useState } from "react"

export default function TestePedido() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: name,
          client_phone: phone,
          items: [],
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || "Erro")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg space-y-4">
      <h1 className="text-xl font-black text-[#102016]">Teste de Pedido</h1>
      <p className="text-sm text-[#526157]">Esta página testa o /api/place-order DIRETAMENTE, sem usar o carrinho.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-sm font-semibold">Nome</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg p-2" required />
        </div>
        <div>
          <label className="text-sm font-semibold">Telefone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded-lg p-2" required />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-[#FF6A00] text-white py-2 rounded-lg font-bold hover:bg-[#e85f00]">
          {loading ? "Enviando..." : "Criar Pedido"}
        </button>
      </form>
      {error && <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-600 text-sm">{error}</div>}
      {result && (
        <div className="bg-[#eef7ef] border border-[#006B2E] p-3 rounded-lg text-sm space-y-1">
          <p><strong>Versão API:</strong> {result._version}</p>
          <p><strong>Protocolo:</strong> {result.protocol}</p>
          <p><strong>Cliente:</strong> {result.client_name}</p>
          <p><strong>Telefone:</strong> {result.client_phone}</p>
          <p><strong>Customer ID:</strong> {result.customer_id}</p>
        </div>
      )}
      <p className="text-xs text-gray-400">Abra o console do navegador (F12 &gt; Console) para ver logs detalhados.</p>
    </div>
  )
}
