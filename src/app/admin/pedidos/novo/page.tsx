import { OrderForm } from "@/components/admin/order-form"

export default function NovoPedidoPage() {
  return (
    <section className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Novo Pedido</h1>
      <p className="text-sm text-[#526157]">Crie um pedido manual para clientes presenciais</p>
      <OrderForm />
    </section>
  )
}
