"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createOrder, listFormCustomers, listFormProducts, listFormBaskets } from "@/app/admin/pedidos/actions"
import { formatCurrency } from "@/lib/services/base"
import { Trash2, Search } from "lucide-react"

interface OrderItem {
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
  unit_cost: number
  total_profit: number
}

export function OrderForm() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [customerSearch, setCustomerSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [baskets, setBaskets] = useState<any[]>([])
  const [selectedBasket, setSelectedBasket] = useState<any>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [deliveryType, setDeliveryType] = useState("RETIRADA")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [notes, setNotes] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    listFormCustomers().then(setCustomers)
    listFormProducts().then((data) => setProducts(data.map((p: any) => ({ ...p, unit_price: p.sale_price || p.price }))))
    listFormBaskets().then((data) => setBaskets(data.map((b: any) => ({ ...b, unit_price: Number(b.price || 0) }))))
  }, [])

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  )
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )
  const filteredBaskets = baskets.filter((b) =>
    b.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const addItem = (product: any) => {
    const existing = items.find((i) => i.product_id === product.id)
    if (existing) {
      setItems(items.map((i) =>
        i.product_id === product.id
          ? {
              ...i,
              quantity: i.quantity + 1,
              total_price: (i.quantity + 1) * i.unit_price,
              total_profit: (i.quantity + 1) * (i.unit_price - i.unit_cost),
            }
          : i
      ))
    } else {
      const unitCost = Number(product.purchase_price || 0)
      const unitPrice = Number(product.sale_price || product.price || 0)
      setItems([...items, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice,
        unit_cost: unitCost,
        total_profit: unitPrice - unitCost,
      }])
    }
    setProductSearch("")
  }

  const addBasket = (basket: any) => {
    setSelectedBasket(basket)
    setItems([{
      product_id: basket.id,
      product_name: basket.name,
      quantity: 1,
      unit_price: basket.unit_price,
      total_price: basket.unit_price,
      unit_cost: 0,
      total_profit: basket.unit_price,
    }])
    setProductSearch("")
  }

  const updateQuantity = (productId: string, qty: number) => {
    if (qty < 1) return
    setItems(items.map((i) =>
      i.product_id === productId
        ? { ...i, quantity: qty, total_price: qty * i.unit_price, total_profit: qty * (i.unit_price - i.unit_cost) }
        : i
    ))
  }

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.product_id !== productId))
  }

  const totalOrder = items.reduce((s, i) => s + i.total_price, 0)
  const totalProfit = items.reduce((s, i) => s + i.total_profit, 0)

  const handleSubmit = async () => {
    if (!selectedCustomer) { setFeedback({ type: "error", message: "Selecione um cliente." }); return }
    if (items.length === 0) { setFeedback({ type: "error", message: "Adicione pelo menos um item." }); return }

    setSubmitting(true)
    setFeedback(null)
    try {
      const order = await createOrder({
        customer_id: selectedCustomer.id,
        basket_id: selectedBasket?.id || null,
        delivery_type: deliveryType as any,
        payment_method: paymentMethod,
        notes,
        delivery_address: deliveryAddress,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price,
          unit_cost: i.unit_cost,
          total_profit: i.total_profit,
          name: i.product_name,
        })),
      })
      setFeedback({ type: "success", message: `Pedido criado com sucesso! Protocolo: ${order.protocol}` })
      setTimeout(() => router.push(`/admin/pedidos/${order.id}`), 1000)
    } catch (error: any) {
      setFeedback({ type: "error", message: error.message || "Erro ao criar pedido." })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`rounded-lg border p-3 text-sm font-medium ${
          feedback.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Customer Selection */}
      <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#102016]">Cliente</h3>
        {selectedCustomer ? (
          <div className="flex items-center justify-between bg-[#fcfdfa] p-3 rounded-lg border">
            <div>
              <div className="font-medium text-[#102016]">{selectedCustomer.name}</div>
              <div className="text-sm text-[#526157]">{selectedCustomer.phone}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setSelectedCustomer(null)}>Trocar</Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9c91]" />
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full pl-9 h-9 rounded-md border border-[#dfe7dd] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006B2E]"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCustomer(c)}
                  className="w-full text-left p-2 rounded-lg hover:bg-[#f0f7f0] text-sm"
                >
                  <div className="font-medium text-[#102016]">{c.name}</div>
                  <div className="text-xs text-[#8c9c91]">{c.phone} {c.city ? `- ${c.city}` : ""}</div>
                </button>
              ))}
              {filteredCustomers.length === 0 && <p className="text-xs text-[#8c9c91] p-2">Nenhum cliente encontrado</p>}
            </div>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#102016]">Itens do Pedido</h3>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9c91]" />
          <input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Buscar produto para adicionar..."
            className="w-full pl-9 h-9 rounded-md border border-[#dfe7dd] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006B2E]"
          />
          {productSearch && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-[#dfe7dd] rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredBaskets.map((b) => (
                <button
                  key={`basket-${b.id}`}
                  type="button"
                  onClick={() => addBasket(b)}
                  className="w-full text-left p-2 hover:bg-[#f0f7f0] text-sm flex justify-between items-center border-b border-[#f0f4f0] last:border-b-0"
                >
                  <div>
                    <span className="font-medium text-[#102016]">{b.name}</span>
                    <span className="ml-2 text-xs bg-[#e8f5e9] text-[#006B2E] px-1.5 py-0.5 rounded-full">{b.tipo?.replace(/_/g, ' ')}</span>
                  </div>
                  <span className="text-[#006B2E]">{formatCurrency(b.price)}</span>
                </button>
              ))}
              {filteredProducts.map((p) => (
                <button
                  key={`product-${p.id}`}
                  type="button"
                  onClick={() => addItem(p)}
                  className="w-full text-left p-2 hover:bg-[#f0f7f0] text-sm flex justify-between"
                >
                  <span className="font-medium text-[#102016]">{p.name}</span>
                  <span className="text-[#006B2E]">{formatCurrency(p.sale_price || p.price)}</span>
                </button>
              ))}
              {filteredBaskets.length === 0 && filteredProducts.length === 0 && (
                <p className="text-xs text-[#8c9c91] p-2">Nenhum item encontrado</p>
              )}
            </div>
          )}
        </div>

        {selectedBasket && (
          <div className="flex items-center justify-between bg-[#e8f5e9] p-3 rounded-lg border border-[#c8e6c9]">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-[#006B2E] text-white px-2 py-0.5 rounded-full font-medium">Cesta</span>
              <span className="font-medium text-[#102016]">{selectedBasket.name}</span>
              <span className="text-sm text-[#526157]">{formatCurrency(selectedBasket.price)}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => { setSelectedBasket(null); setItems([]) }}>
              Remover
            </Button>
          </div>
        )}

        {items.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#fcfdfa] text-left">
                <tr>
                  <th className="px-3 py-2 font-semibold text-[#526157]">Produto</th>
                  <th className="px-3 py-2 font-semibold text-[#526157] text-right">Valor Un.</th>
                  <th className="px-3 py-2 font-semibold text-[#526157] text-right">Qtd</th>
                  <th className="px-3 py-2 font-semibold text-[#526157] text-right">Total</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f4f0]">
                {items.map((item) => (
                  <tr key={item.product_id}>
                    <td className="px-3 py-2 font-medium text-[#102016]">{item.product_name}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.product_id, Number(e.target.value))}
                        min="1"
                        className="w-16 text-center rounded border border-[#dfe7dd] p-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.total_price)}</td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" onClick={() => removeItem(item.product_id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-[#f0f4f0]">
          <div className="text-sm text-[#526157]">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </div>
          <div className="text-right">
            <div className="text-sm text-[#526157]">Total: <span className="text-xl font-black text-[#102016]">{formatCurrency(totalOrder)}</span></div>
            <div className="text-xs text-green-600">Lucro: {formatCurrency(totalProfit)}</div>
          </div>
        </div>
      </div>

      {/* Delivery & Payment */}
      <div className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-[#102016]">Entrega e Pagamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-[#102016]">Tipo de Entrega</label>
            <select
              value={deliveryType}
              onChange={(e) => setDeliveryType(e.target.value)}
              className="w-full h-9 rounded-md border border-[#dfe7dd] px-3 text-sm"
            >
              <option value="RETIRADA">Retirada</option>
              <option value="ENTREGA">Entrega</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-[#102016]">Forma de Pagamento</label>
            <input
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              placeholder="Ex: Dinheiro, Cartão, Pix..."
              className="w-full h-9 rounded-md border border-[#dfe7dd] px-3 text-sm"
            />
          </div>
        </div>
        {deliveryType === "ENTREGA" && (
          <div>
            <label className="block text-sm font-medium mb-1 text-[#102016]">Endereço de Entrega</label>
            <Textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Endereço completo para entrega..."
              rows={2}
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1 text-[#102016]">Observações</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações sobre o pedido..."
            rows={2}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-[#006B2E] text-white hover:bg-[#005324]"
        >
          {submitting ? "Criando..." : "Criar Pedido"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/pedidos")}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
