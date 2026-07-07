"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteOrder } from "@/app/admin/pedidos/actions"
import { Trash2 } from "lucide-react"

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.")) return
    try {
      await deleteOrder(orderId)
      router.push("/admin/pedidos")
    } catch (e: any) {
      alert("Erro ao excluir pedido: " + e.message)
    }
  }

  return (
    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 mr-2" />
      Excluir Pedido
    </Button>
  )
}
