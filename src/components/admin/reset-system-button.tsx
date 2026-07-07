"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RotateCcw, Loader2, CheckCircle2 } from "lucide-react"
import { resetSystem } from "@/app/admin/configuracoes/cleanup-actions"

export function ResetSystemButton() {
  const router = useRouter()
  const [step, setStep] = useState<"idle" | "confirm" | "loading" | "done">("idle")
  const [error, setError] = useState("")

  const handleReset = async () => {
    setStep("loading")
    setError("")
    try {
      await resetSystem()
      setStep("done")
    } catch (e: any) {
      setError(e.message || "Erro ao restaurar sistema")
      setStep("confirm")
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-700" />
          <div>
            <h3 className="text-base font-bold text-green-800">Sistema restaurado com sucesso!</h3>
            <p className="text-sm text-green-700">Todos os dados operacionais foram removidos.</p>
          </div>
        </div>
        <Button onClick={() => { router.refresh(); setStep("idle") }} variant="outline" size="sm">
          Fechar
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-red-600" />
        <div>
          <h3 className="text-base font-bold text-red-800">Restaurar Sistema</h3>
          <p className="text-sm text-red-700">
            Remove todos os pedidos, clientes, movimentações financeiras, notas fiscais, anotações e reseta o estoque.
            Categorias, cestas, kits, marcas e configurações são mantidos.
          </p>
        </div>
      </div>

      {step === "idle" && (
        <Button onClick={() => setStep("confirm")} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Sistema
        </Button>
      )}

      {step === "confirm" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-red-800">Tem certeza? Esta ação é irreversível.</p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleReset} className="bg-red-600 text-white hover:bg-red-700">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sim, restaurar sistema
            </Button>
            <Button onClick={() => setStep("idle")} variant="outline">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {step === "loading" && (
        <div className="flex items-center gap-2 text-sm text-red-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Restaurando sistema...
        </div>
      )}
    </div>
  )
}
