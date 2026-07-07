"use client"

import { useEffect, useState } from "react"
import { getPublicProductsForCustomizer } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Minus, ShoppingBag, CheckCircle2, ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-context"

interface Product {
  id: string
  name: string
  description?: string
  image_url?: string
  stock: number
  sale_price?: number
  purchase_price?: number
  category?: { id: string; name: string } | null
  peso?: string
  volume?: string
  unidade?: string
  brand_id?: string
  brand?: { id: string; name: string; ativo: boolean } | null
}

interface Brand {
  id: string
  name: string
}

interface ProductBrand {
  product_id: string
  brand_id: string
  sale_price?: number
  purchase_price?: number
  brand: { id: string; name: string }
}

interface CustomizerModalProps {
  isOpen: boolean
  onClose: () => void
  basketId: string
  basketName: string
}

export default function CustomizerModal({ isOpen, onClose, basketId, basketName }: CustomizerModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [productBrands, setProductBrands] = useState<ProductBrand[]>([])
  const [selectedItems, setSelectedItems] = useState<Record<string, { quantity: number; chosen_brand_id?: string }>>({})
  const { addItem } = useCart()
  const [step, setStep] = useState<1 | 2>(1) // 1: Select items, 2: Success
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      setSelectedItems({})
      setStep(1)
      setAdded(false)
      setError("")
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    async function loadData() {
      try {
        setIsLoading(true)
        const data = await getPublicProductsForCustomizer()
        const normalizedProducts = (data.products ?? []).map((p: any) => ({
          ...p,
          brand: Array.isArray(p.brand) ? p.brand[0] ?? null : p.brand ?? null,
          category: Array.isArray(p.category) ? p.category[0] ?? null : p.category ?? null,
        })) as Product[]
        setProducts(normalizedProducts)
        setBrands(data.brands)
        setProductBrands(data.productBrands ?? [])
      } catch (err) {
        console.error("Erro ao carregar dados do customizador:", err)
        setError("Não foi possível carregar os produtos para personalização no momento.")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [isOpen])

  if (!isOpen) return null

  const categories: Record<string, Product[]> = {}
  products.forEach((p) => {
    const catObj = p.category ? (Array.isArray(p.category) ? p.category[0] : p.category) : null
    const cat = catObj?.name || "Mercearia"
    if (!categories[cat]) categories[cat] = []
    categories[cat].push(p)
  })

  // Quantities handling
  const handleUpdateQty = (productId: string, delta: number) => {
    setSelectedItems((prev) => {
      const current = prev[productId]
      const newQty = (current?.quantity ?? 0) + delta
      
      if (newQty <= 0) {
        const next = { ...prev }
        delete next[productId]
        return next
      }

      const firstBrand = productBrands.find(pb => pb.product_id === productId)?.brand
      const defaultBrandId = current?.chosen_brand_id || firstBrand?.id || ""

      return {
        ...prev,
        [productId]: {
          quantity: newQty,
          chosen_brand_id: defaultBrandId,
        },
      }
    })
  }

  const handleUpdateBrand = (productId: string, brandId: string) => {
    setSelectedItems((prev) => {
      const current = prev[productId]
      if (!current) return prev
      return {
        ...prev,
        [productId]: {
          ...current,
          chosen_brand_id: brandId,
        },
      }
    })
  }

  const totalItems = Object.values(selectedItems).reduce((sum, item) => sum + item.quantity, 0)
  const hasBrandSelection = Object.entries(selectedItems).every(([prodId, details]) => {
    const prod = products.find(p => p.id === prodId)
    if (!prod) return true
    const associatedBrands = productBrands.filter(pb => pb.product_id === prodId)
    const hasBrands = associatedBrands.length > 0 || !!prod.brand
    if (!hasBrands) return true
    return !!details.chosen_brand_id
  })
  const MIN_ITEMS = 25
  const hasMinItems = totalItems >= MIN_ITEMS
  const isValid = hasMinItems && hasBrandSelection

  const handleAddToCart = () => {
    Object.entries(selectedItems).forEach(([prodId, details]) => {
      const prod = products.find(p => p.id === prodId)
      if (!prod) return
      const brandPrice = details.chosen_brand_id
        ? productBrands.find(pb => pb.product_id === prodId && pb.brand_id === details.chosen_brand_id)?.sale_price
        : null
      const unitPrice = brandPrice ?? prod.sale_price ?? 0
      const brandName = details.chosen_brand_id
        ? (productBrands.find(pb => pb.product_id === prodId && pb.brand_id === details.chosen_brand_id)?.brand?.name
          || prod.brand?.name
          || "")
        : ""
      addItem({
        id: `custom_${prodId}_${details.chosen_brand_id || "default"}`,
        product_id: prodId,
        product_name: prod.name,
        quantity: details.quantity,
        chosen_brand_id: details.chosen_brand_id,
        brand_name: brandName,
        unit_price: unitPrice,
        total_price: unitPrice * details.quantity,
        basket_id: basketId,
        basket_name: basketName,
        specs: [prod.peso, prod.volume, prod.unidade].filter(Boolean).join(" · "),
      })
    })
    setAdded(true)
    setStep(2)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#dfe7dd] overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dfe7dd] bg-[#fbfcf8]">
          <div>
            <h2 className="text-xl font-black text-[#102016] flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-[#006B2E]" />
              {basketName}
            </h2>
            <p className="text-xs text-[#526157]">Monte seu pedido personalizado com as marcas de sua preferência.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg border border-[#dfe7dd] hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#006B2E] border-t-transparent"></div>
              <p className="text-sm font-semibold text-[#526157]">Carregando catálogo de produtos...</p>
            </div>
          )}

          {!isLoading && step === 1 && (
            <div className="space-y-8">
              {/* Items Counter */}
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-muted-foreground">Itens selecionados:</span>
                <Badge className={`px-2.5 py-0.5 rounded-full text-white font-extrabold ${isValid ? "bg-[#006B2E]" : totalItems >= MIN_ITEMS ? "bg-[#e85f00]" : "bg-gray-400"}`}>
                  {totalItems}
                </Badge>
              </div>
              {totalItems > 0 && totalItems < MIN_ITEMS && (
                <p className="text-xs text-[#e85f00] font-semibold text-right">
                  Selecione pelo menos {MIN_ITEMS} itens para prosseguir
                </p>
              )}

              {/* Products List by Category */}
              {Object.keys(categories).length === 0 ? (
                <p className="text-center py-10 text-sm text-[#8c9c91] italic">Nenhum produto cadastrado ou em estoque.</p>
              ) : (
                Object.entries(categories).map(([category, items]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-base font-black text-[#006B2E] border-b border-[#dfe7dd] pb-1.5 uppercase tracking-wider">{category}</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {items.map((prod) => {
                        const selected = selectedItems[prod.id]
                        const qty = selected?.quantity ?? 0

                        // Specifications text
                        const specs = [
                          prod.peso && `Peso: ${prod.peso}`,
                          prod.volume && `Vol: ${prod.volume}`,
                          prod.unidade && `Un: ${prod.unidade}`
                        ].filter(Boolean).join(" · ")

                        return (
                          <div key={prod.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${qty > 0 ? "border-[#006B2E] bg-[#fdfefb] shadow-sm" : "border-[#dfe7dd] bg-white hover:border-[#b4c8b2]"}`}>
                            <div className="flex-1 min-w-0 pr-4 space-y-1.5">
                              <div>
                                <h4 className="text-sm font-bold text-[#102016] truncate">{prod.name}</h4>
                                {specs && <p className="text-xs text-[#8c9c91] font-medium">{specs}</p>}
                              </div>

                              {/* Brand Selector */}
                              {qty > 0 && (() => {
                                const associatedBrands = productBrands
                                  .filter(pb => pb.product_id === prod.id)
                                  .map(pb => pb.brand)
                                const hasAssociatedBrands = associatedBrands.length > 0
                                const displayBrands = hasAssociatedBrands ? associatedBrands : (prod.brand ? [prod.brand] : [])
                                return (
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-[#526157] uppercase tracking-wider block">
                                      {hasAssociatedBrands ? "Selecione a marca *" : "Marca:"}
                                    </label>
                                    {displayBrands.length > 0 ? (
                                      <select
                                        value={selected.chosen_brand_id || ""}
                                        onChange={(e) => handleUpdateBrand(prod.id, e.target.value)}
                                        className="text-xs font-semibold rounded-md border border-[#dfe7dd] bg-white p-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#006B2E]"
                                      >
                                        <option value="">{hasAssociatedBrands ? "Selecione uma marca" : "Sem marca"}</option>
                                        {displayBrands.map((b: any) => (
                                          <option key={b.id} value={b.id}>
                                            {b.name}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="text-xs text-[#8c9c91]">Sem marca disponível</span>
                                    )}
                                  </div>
                                )
                              })()}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              {qty > 0 && (
                                <>
                                  <button
                                    onClick={() => handleUpdateQty(prod.id, -1)}
                                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-[#dfe7dd] bg-white text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-extrabold text-[#102016]">{qty}</span>
                                </>
                              )}
                              <button
                                onClick={() => handleUpdateQty(prod.id, 1)}
                                className={`h-8 w-8 flex items-center justify-center rounded-lg active:scale-95 transition-all ${qty > 0 ? "bg-[#006B2E] text-white hover:bg-[#005324]" : "border border-[#dfe7dd] bg-white text-[#006B2E] hover:bg-[#eef7ef] hover:border-[#006B2E]"}`}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!isLoading && step === 2 && (
            <div className="max-w-md mx-auto py-10 text-center space-y-6 animate-scale-up">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-[#eef7ef] rounded-full flex items-center justify-center text-[#006B2E]">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-[#102016]">Itens adicionados ao carrinho!</h3>
                <p className="text-sm text-[#526157]">Seus itens foram adicionados ao carrinho. Finalize o pedido quando estiver pronto.</p>
              </div>
              <Button onClick={onClose} className="w-full bg-[#006B2E] text-white py-3 rounded-lg font-bold hover:bg-[#005324]">
                Continuar Comprando
              </Button>
            </div>
          )}
        </div>

        {/* Modal Footer (Only in Step 1) */}
        {step === 1 && (
          <div className="px-6 py-4 border-t border-[#dfe7dd] bg-[#fbfcf8] flex items-center justify-between">
            <div className="text-sm text-[#526157]">
              Total selecionado: <span className="font-extrabold text-[#102016]">{totalItems}</span> itens
              {totalItems > 0 && totalItems < MIN_ITEMS && (
                <p className="text-xs text-[#e85f00] font-semibold mt-1">Mínimo: {MIN_ITEMS} itens</p>
              )}
            </div>
            
            <Button
              disabled={!isValid || added}
              onClick={handleAddToCart}
              className={`font-bold transition-all ${isValid && !added ? "bg-[#006B2E] text-white hover:bg-[#005324]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              {added ? <><CheckCircle2 className="h-4 w-4 mr-1" /> Adicionado!</> : !hasMinItems ? <>Mínimo {MIN_ITEMS} itens</> : !hasBrandSelection ? <>Selecione as marcas</> : <><ShoppingCart className="h-4 w-4 mr-1" /> Adicionar ao Carrinho</>}
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}
