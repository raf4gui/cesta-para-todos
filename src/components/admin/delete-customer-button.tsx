"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { deleteCustomer } from "@/app/admin/clientes/actions"
import { Trash2 } from "lucide-react"

export function DeleteCustomerButton({ customerId, hasOrders }: { customerId: string; hasOrders: boolean }) {
  const router = useRouter()

  const handleDelete = async () => {
    const warning = hasOrders
      ? "ATENÇÃO: Este cliente possui pedidos vinculados. A exclusão pode falhar.\n\nTem certeza que deseja excluir?"
      : "Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
    if (!window.confirm(warning)) return

    try {
      await deleteCustomer(customerId)
      router.refresh()
    } catch (e: any) {
      alert("Erro ao excluir cliente: " + e.message)
    }
  }

  return (
    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 mr-2" />
      Excluir Cliente
    </Button>
  )
}
