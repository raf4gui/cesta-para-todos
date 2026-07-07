"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteCustomer } from "@/app/admin/clientes/actions"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { AlertTriangle, X } from "lucide-react"

export function DeleteClientButton({ customerId, customerName }: { customerId: string; customerName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    setError("")
    try {
      await deleteCustomer(customerId)
      setOpen(false)
      router.refresh()
    } catch (e: any) {
      setError(e.message || "Erro ao excluir")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" className="text-red-600" onClick={() => setOpen(true)} title="Excluir">
        <Trash2 className="h-3 w-3" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md mx-4 rounded-xl border border-[#dfe7dd] bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#102016]">Excluir cliente</h3>
                <p className="text-sm text-[#526157]">Esta ação não pode ser desfeita.</p>
              </div>
              <button onClick={() => setOpen(false)} className="ml-auto p-1 rounded hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-[#102016] mb-1 font-medium">Tem certeza que deseja excluir &ldquo;{customerName}&rdquo;?</p>
            <p className="text-sm text-[#8c9c91] mb-6">O registro será removido permanentemente.</p>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 whitespace-pre-line">{error}</div>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={deleting}>Cancelar</Button>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Excluindo..." : "Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
