"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, ShoppingCart, CheckCircle2, PackageOpen } from "lucide-react"
import { useCart } from "@/lib/cart-context"

interface PredefinedOrderModalProps {
  isOpen: boolean
  onClose: () => void
  basket: {
    id: string
    name: string
    description?: string
    image_url?: string
  }
  compositionItems: Array<{
    product_id: string
    quantity: number
    product: {
      name: string
      peso?: string
      volume?: string
      unidade?: string
      brand?: { name: string }
      sale_price?: number
    }
  }>
}

export default function PredefinedOrderModal({ isOpen, onClose, basket, compositionItems }: PredefinedOrderModalProps) {
  const { addItem, totalItems } = useCart()
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  if (!isOpen) return null

  const handleAddToCart = () => {
    const totalPrice = compositionItems.reduce((sum, item) => sum + (item.product.sale_price || 0) * item.quantity, 0)
    addItem({
      id: `basket_${basket.id}`,
      product_id: basket.id,
      product_name: basket.name,
      quantity: 1,
      unit_price: totalPrice,
      total_price: totalPrice,
      basket_id: basket.id,
      basket_name: basket.name,
      image_url: basket.image_url,
      is_basket_item: true,
      items: compositionItems.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
    })
    setAdded(true)
    setTimeout(() => { onClose() }, 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#dfe7dd]" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dfe7dd] bg-[#fbfcf8] shrink-0">
          <div>
            <h2 className="text-lg font-black text-[#102016]">{basket.name}</h2>
            <p className="text-xs text-[#526157]">Veja os itens inclusos e adicione ao carrinho.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border border-[#dfe7dd] hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {basket.image_url && (
            <div className="w-full aspect-video rounded-xl overflow-hidden border bg-[#f5f7f2]">
              <img src={basket.image_url} alt={basket.name} className="w-full h-full object-cover" />
            </div>
          )}
          {!basket.image_url && (
            <div className="w-full aspect-video rounded-xl overflow-hidden border bg-[#f5f7f2] flex items-center justify-center">
              <PackageOpen className="h-16 w-16 text-[#006B2E] opacity-40" />
            </div>
          )}

          {basket.description && (
            <p className="text-sm text-[#526157] leading-relaxed">{basket.description}</p>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-black text-[#102016] uppercase tracking-wider">Itens inclusos ({compositionItems.length})</h3>
            <div className="space-y-2">
              {compositionItems.map((item, idx) => {
                const brandStr = item.product.brand?.name ? ` - ${item.product.brand.name}` : ""
                const specs = [item.product.peso, item.product.volume, item.product.unidade].filter(Boolean).join(" · ")
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-[#dfe7dd] bg-white">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#102016]">{item.product.name}{brandStr}</p>
                      {specs && <p className="text-xs text-[#8c9c91]">{specs}</p>}
                    </div>
                    <span className="text-sm font-bold text-[#006B2E] ml-3">x{item.quantity}</span>
                  </div>
                )
              })}
              {compositionItems.length === 0 && (
                <p className="text-sm text-[#8c9c91] italic">Composição a ser definida.</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#dfe7dd] bg-[#fbfcf8] shrink-0">
          {added ? (
            <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" /> Adicionado ao carrinho!
            </div>
          ) : (
            <Button onClick={handleAddToCart} className="w-full bg-[#006B2E] text-white py-3 rounded-xl font-bold hover:bg-[#005324] transition-all">
              <ShoppingCart className="h-4 w-4 mr-2" /> Adicionar ao Carrinho
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}
