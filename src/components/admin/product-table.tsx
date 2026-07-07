"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toggleProductStatus, deleteProduct, duplicateProduct, excludeProduct } from "@/app/admin/produtos/actions"
import { formatCurrency } from "@/lib/services/base"
import { useRouter } from "next/navigation"
import { Copy, Pencil, Trash2, EyeOff, Eye, AlertTriangle, X } from "lucide-react"
import { RealtimeRefresh } from "@/components/admin/realtime-refresh"
import { useState } from "react"

interface Product {
  id: string; name: string; stock: number; price: number
  sale_price?: number; purchase_price?: number; min_stock?: number
  ativo: boolean; disponivel?: boolean
  category?: { name: string } | null; brand?: { name: string } | null
  supplier?: string; internal_code?: string
}

export default function ProductTable({ products }: { products: Product[] }) {
  const router = useRouter()
  const [confirmExclude, setConfirmExclude] = useState<{ id: string; name: string } | null>(null)
  const [excludeError, setExcludeError] = useState("")
  const [excluding, setExcluding] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleToggle = async (id: string, field: "ativo" | "disponivel", value: boolean) => {
    try {
      await toggleProductStatus(id, field, value)
      router.refresh()
    } catch (e: any) {
      setActionError(e.message || "Erro ao alterar status")
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateProduct(id)
      router.refresh()
    } catch (e: any) {
      setActionError(e.message || "Erro ao duplicar")
    }
  }

  const handleDeactivate = async (id: string) => {
    try {
      await deleteProduct(id)
      router.refresh()
    } catch (e: any) {
      setActionError(e.message || "Erro ao desativar")
    }
  }

  const handleExclude = async () => {
    if (!confirmExclude) return
    setExcluding(true)
    setExcludeError("")
    try {
      await excludeProduct(confirmExclude.id)
      setConfirmExclude(null)
      router.refresh()
    } catch (e: any) {
      setExcludeError(e.message || "Erro ao excluir")
    } finally {
      setExcluding(false)
    }
  }

  if (products.length === 0) {
    return (
      <>
        <RealtimeRefresh tables={["products"]} />
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-12 text-center">
          <p className="text-[#8c9c91] mb-4">Nenhum produto encontrado.</p>
          <Link href="/admin/produtos/novo">
            <Button className="bg-[#006B2E] text-white hover:bg-[#005324]">Cadastrar Produto</Button>
          </Link>
        </div>
      </>
    )
  }

  return (
    <>
      <RealtimeRefresh tables={["products"]} />
      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="ml-2 p-1 rounded hover:bg-red-100"><X className="h-3 w-3" /></button>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-[#dfe7dd] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#fcfdfa] text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-[#526157]">Produto</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Código</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Categoria</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Marca</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Venda</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Custo</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Estoque</th>
              <th className="px-4 py-3 font-semibold text-[#526157]">Status</th>
              <th className="px-4 py-3 font-semibold text-[#526157] text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f4f0]">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-[#fcfdfa]">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#102016]">{p.name}</div>
                  {p.supplier && <div className="text-xs text-[#8c9c91]">{p.supplier}</div>}
                </td>
                <td className="px-4 py-3 text-[#8c9c91] font-mono text-xs">{p.internal_code || "-"}</td>
                <td className="px-4 py-3">{p.category?.name || "-"}</td>
                <td className="px-4 py-3">{p.brand?.name || "-"}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(p.sale_price || p.price)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(p.purchase_price || 0)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-mono font-bold ${p.stock <= (p.min_stock || 5) ? "text-red-600" : "text-green-600"}`}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={p.ativo ? "default" : "secondary"} className={p.ativo ? "bg-green-100 text-green-700" : ""}>
                    {p.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link href={`/admin/produtos/${p.id}`}>
                      <Button size="sm" variant="outline" title="Editar"><Pencil className="h-3 w-3" /></Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => handleDuplicate(p.id)} title="Duplicar"><Copy className="h-3 w-3" /></Button>
                    {p.ativo ? (
                      <Button size="sm" variant="outline" onClick={() => handleDeactivate(p.id)} title="Desativar"><EyeOff className="h-3 w-3 text-amber-600" /></Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleToggle(p.id, "ativo", true)} title="Reativar"><Eye className="h-3 w-3 text-green-600" /></Button>
                    )}
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => { setConfirmExclude({ id: p.id, name: p.name }); setExcludeError("") }} title="Excluir">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exclude confirmation modal */}
      {confirmExclude && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmExclude(null)}>
          <div className="w-full max-w-md mx-4 rounded-xl border border-[#dfe7dd] bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#102016]">Excluir produto</h3>
                <p className="text-sm text-[#526157]">Esta ação não pode ser desfeita.</p>
              </div>
              <button onClick={() => setConfirmExclude(null)} className="ml-auto p-1 rounded hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-[#102016] mb-1 font-medium">Tem certeza que deseja excluir este registro?</p>
            <p className="text-sm text-[#8c9c91] mb-6">&ldquo;{confirmExclude.name}&rdquo; será removido permanentemente.</p>

            {excludeError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 whitespace-pre-line">{excludeError}</div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setConfirmExclude(null)} disabled={excluding}>Cancelar</Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleExclude} disabled={excluding}>
                {excluding ? "Excluindo..." : "Excluir definitivamente"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
