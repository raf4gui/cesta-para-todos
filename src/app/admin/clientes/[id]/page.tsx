import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCustomer } from "@/lib/services/customers"
import { DeleteCustomerButton } from "@/components/admin/delete-customer-button"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/services/base"
import { Phone, MapPin, CreditCard, ShoppingBag, Pencil } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let data
  try {
    data = await getCustomer(id)
  } catch {
    notFound()
  }

  const { customer, orders } = data

  return (
    <section className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[#102016]">{customer.name}</h1>
            <Badge variant={customer.ativo ? "default" : "secondary"} className={customer.ativo ? "bg-green-100 text-green-700" : ""}>
              {customer.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-[#526157]">
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</span>
            {customer.whatsapp && <span className="flex items-center gap-1 text-green-600"><Phone className="h-3 w-3" /> WhatsApp: {customer.whatsapp}</span>}
            {customer.cpf_cnpj && <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> {customer.cpf_cnpj}</span>}
            {customer.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {customer.city}</span>}
          </div>
          {customer.address && <p className="text-sm text-[#8c9c91] mt-1">{customer.address}</p>}
        </div>
        <div className="flex gap-2">
          <DeleteCustomerButton customerId={customer.id} hasOrders={orders.length > 0} />
          <Link href={`/admin/clientes/${customer.id}/editar`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#526157]">Total de Compras</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-[#102016]">{orders.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#526157]">Valor Gasto</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-[#102016]">{formatCurrency(customer.total_spent)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#526157]">Última Compra</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-bold text-[#102016]">{customer.last_purchase_date ? formatDate(customer.last_purchase_date) : "Nenhuma"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-[#526157]">Cadastro</CardTitle></CardHeader>
          <CardContent><div className="text-lg font-bold text-[#102016]">{formatDate(customer.created_at)}</div></CardContent>
        </Card>
      </div>

      {customer.notes && (
        <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-[#102016] mb-2">Observações</h3>
          <p className="text-sm text-[#526157]">{customer.notes}</p>
        </div>
      )}

      <div className="rounded-xl border border-[#dfe7dd] bg-white shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-[#fcfdfa]">
          <h2 className="text-sm font-bold text-[#102016] flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[#006B2E]" />
            Histórico de Pedidos
          </h2>
        </div>
        {orders.length === 0 ? (
          <div className="py-8 text-center text-[#8c9c91]">Nenhum pedido encontrado.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#fcfdfa] text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-[#526157]">Protocolo</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Cesta</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Valor</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Status</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Pagamento</th>
                <th className="px-4 py-3 font-semibold text-[#526157]">Data</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f0]">
              {orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-[#fcfdfa]">
                  <td className="px-4 py-3 font-mono text-[#006B2E]">{order.protocol}</td>
                  <td className="px-4 py-3">{order.basket?.name || "Manual"}</td>
                  <td className="px-4 py-3 font-mono">{formatCurrency(order.total_value)}</td>
                  <td className="px-4 py-3"><Badge>{order.status?.replace(/_/g, " ")}</Badge></td>
                  <td className="px-4 py-3"><Badge variant="outline">{order.payment_status}</Badge></td>
                  <td className="px-4 py-3 text-[#8c9c91]">{formatDateTime(order.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/pedidos/${order.id}`}>
                      <Button size="sm" variant="outline">Abrir</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
