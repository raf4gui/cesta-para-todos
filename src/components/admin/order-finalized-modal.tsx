"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Printer, Share2, ArrowLeft } from "lucide-react"

interface Props {
  orderId: string
  printerType: string
  shareMessage: string
  open: boolean
}

export function OrderFinalizedModal({ orderId, printerType, shareMessage, open }: Props) {
  const router = useRouter()

  const handlePrint = useCallback(() => {
    const url = `/imprimir/pedido/${orderId}?printer_type=${printerType}`
    window.open(url, "_blank")
  }, [orderId, printerType])

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareMessage)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = shareMessage
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
  }, [shareMessage])

  const handleBack = useCallback(() => {
    router.push("/admin/pedidos")
  }, [router])

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) router.replace(`/admin/pedidos/${orderId}`)
    }}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center gap-6 py-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-[#102016] text-center">Pedido Finalizado com Sucesso!</h2>
          <div className="flex flex-col gap-3 w-full">
            <Button onClick={handlePrint} className="bg-[#006B2E] text-white hover:bg-[#005324]">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={handleShare} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <Button onClick={handleBack} variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
