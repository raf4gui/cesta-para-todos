"use client"

import { useState, useEffect, useRef } from "react"
import { useCart } from "@/lib/cart-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingCart, X, Plus, Minus, MessageCircle, CheckCircle2, Trash2 } from "lucide-react"

export function CartButton() {
  const { totalItems, hydrated } = useCart()
  const [open, setOpen] = useState(false)

  const showButton = hydrated && totalItems > 0

  return (
    <>
      {showButton && (
        <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#FF6A00] text-white px-5 py-3 shadow-[0_8px_24px_rgba(255,106,0,0.35)] hover:bg-[#e85f00] transition-all hover:scale-105">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-bold text-sm">{totalItems}</span>
        </button>
      )}
      <CartDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, totalItems, totalValue, removeItem, updateQuantity, clearCart } = useCart()
  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [whatsappUrl, setWhatsappUrl] = useState("")
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  const handleClose = () => {
    if (step === "success") clearCart()
    setStep("cart")
    setError("")
    setWhatsappUrl("")
    setIsSubmitting(false)
    onClose()
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    const rawName = nameRef.current?.value?.trim() || ""
    const rawPhone = phoneRef.current?.value?.trim() || ""
    console.log("=== CART DRAWER (REF) ===")
    console.log("Nome (do DOM):", JSON.stringify(rawName))
    console.log("Telefone (do DOM):", JSON.stringify(rawPhone))
    if (!rawName || !rawPhone) {
      setError("Nome e telefone são obrigatórios.")
      return
    }
    setIsSubmitting(true)
    setError("")
    try {
      const basketItem = items.find(i => i.basket_id)
      const flatItems = items.flatMap(i => {
        if (i.is_basket_item && i.items) {
          return i.items.map(sub => ({
            product_id: sub.product_id,
            quantity: sub.quantity * i.quantity,
            chosen_brand_id: sub.chosen_brand_id,
          }))
        }
        return [{
          product_id: i.product_id,
          quantity: i.quantity,
          chosen_brand_id: i.chosen_brand_id,
        }]
      })
      console.log("Enviando telefone (do DOM):", JSON.stringify(rawPhone))
      const res = await fetch("/api/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: rawName,
          client_phone: rawPhone,
          basket_id: basketItem?.basket_id || undefined,
          items: flatItems,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Erro ao processar pedido")
      }
      console.log("API retornou:", JSON.stringify(data, null, 2))
      setWhatsappUrl(data.whatsapp_url)
      setStep("success")
      window.open(data.whatsapp_url, "_blank")
    } catch (err) {
      console.log("ERRO:", err)
      setError("Erro ao processar pedido.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
      <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dfe7dd]">
          <h2 className="text-lg font-black text-[#102016] flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#006B2E]" />
            Carrinho ({totalItems} {totalItems === 1 ? "item" : "itens"})
          </h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg border hover:bg-red-50 text-gray-400 hover:text-red-500"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm font-semibold text-red-600">{error}</div>}

          {step === "cart" && (
            <>
              {items.length === 0 ? (
                <div className="text-center py-12 text-[#8c9c91]">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-semibold">Seu carrinho está vazio</p>
                  <p className="text-sm">Adicione cestas, fardos ou produtos do catálogo.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-[#dfe7dd] bg-white">
                      {item.is_basket_item && item.image_url && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0 bg-[#f5f7f2]">
                          <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#102016]">{item.product_name}</p>
                        {item.is_basket_item && item.items && (
                          <div className="mt-1 space-y-0.5">
                            <p className="text-[10px] text-[#526157]">{item.items.length} itens inclusos</p>
                            {item.items.map((sub, idx) => (
                              <p key={idx} className="text-[10px] text-[#8c9c91]">
                                {sub.brand_name ? `${sub.brand_name} - ` : ""}{sub.specs ? `${sub.specs} ` : ""}x{sub.quantity}
                              </p>
                            ))}
                          </div>
                        )}
                        {!item.is_basket_item && item.brand_name && <p className="text-xs text-[#526157] font-medium">Marca: {item.brand_name}</p>}
                        {!item.is_basket_item && item.specs && <p className="text-xs text-[#8c9c91]">{item.specs}</p>}
                        {item.basket_name && !item.is_basket_item && <p className="text-xs text-[#006B2E] font-semibold">{item.basket_name}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="h-7 w-7 flex items-center justify-center rounded border border-[#dfe7dd] hover:bg-gray-50"><Minus className="h-3 w-3" /></button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="h-7 w-7 flex items-center justify-center rounded border border-[#dfe7dd] hover:bg-gray-50"><Plus className="h-3 w-3" /></button>
                        <button onClick={() => removeItem(item.id)} className="h-7 w-7 flex items-center justify-center rounded border border-red-200 text-red-500 hover:bg-red-50 ml-1"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === "checkout" && (
            <form onSubmit={handleCheckout} className="space-y-4 max-w-sm mx-auto pt-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#102016]">Nome Completo</label>
                <Input ref={nameRef} defaultValue="" placeholder="Seu nome" disabled={isSubmitting} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#102016]">Telefone (WhatsApp)</label>
                <Input ref={phoneRef} defaultValue="" placeholder="(74) 99999-9999" disabled={isSubmitting} required />
              </div>
              <div className="bg-[#fcfdfa] rounded-xl p-4 border border-[#dfe7dd] space-y-1">
                <div className="flex justify-between text-sm"><span>Itens:</span><span className="font-bold">{totalItems}</span></div>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full bg-[#FF6A00] text-white py-3 rounded-lg font-bold hover:bg-[#e85f00]">
                {isSubmitting ? "Enviando..." : "Finalizar Pedido via WhatsApp"}
              </Button>
              <Button type="button" variant="ghost" className="w-full text-[#526157]" onClick={() => setStep("cart")}>Voltar ao carrinho</Button>
            </form>
          )}

          {step === "success" && (
            <div className="text-center space-y-6 py-10">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-[#eef7ef] rounded-full flex items-center justify-center text-[#006B2E]">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#102016]">Pedido enviado!</h3>
                <p className="text-sm text-[#526157]">Seu pedido foi enviado para o WhatsApp da loja.</p>
              </div>
              <a href={whatsappUrl} target="_blank" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6A00] text-white py-3 font-bold hover:bg-[#e85f00] shadow-[0_8px_18px_rgba(255,106,0,0.24)]">
                <MessageCircle className="h-5 w-5" /> Ir para WhatsApp
              </a>
              <Button variant="outline" className="w-full" onClick={handleClose}>Fechar</Button>
            </div>
          )}
        </div>

          {step === "cart" && items.length > 0 && (
          <div className="px-6 py-4 border-t border-[#dfe7dd] bg-[#fbfcf8] space-y-3">
            <Button onClick={() => setStep("checkout")} className="w-full bg-[#FF6A00] text-white py-3 rounded-lg font-bold hover:bg-[#e85f00]">
              Finalizar Pedido
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
