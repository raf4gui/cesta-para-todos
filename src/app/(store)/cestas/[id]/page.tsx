"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PackageOpen, ShoppingCart, MessageCircle, Minus, Plus } from "lucide-react"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { getWhatsAppPhone } from "@/app/actions"

function formatTipo(tipo: string) {
  const map: Record<string, string> = {
    CESTA_PRATICA: "Cesta Prática", CESTA_COMPLETA: "Cesta Completa",
    CESTAO_FAMILIA: "Cestão Família", CESTA_PERSONALIZADA: "Personalizável",
    KIT: "Kit", FARDO: "Fardo",
  }
  return map[tipo] || tipo
}

interface ProductBrand {
  product_id: string
  brand_id: string
  sale_price?: number
  purchase_price?: number
  brand: { id: string; name: string }
}

interface FardoSelection {
  product_id: string
  quantity: number
  chosen_brand_id: string
  brand_name: string
}

export default function CestaPage({ params }: { params: Promise<{ id: string }> }) {
  const { addItem } = useCart()
  const [id, setId] = useState<string | null>(null)
  const [basket, setBasket] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [productBrands, setProductBrands] = useState<ProductBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const [clientName, setClientName] = useState("")
  const [fardoSelections, setFardoSelections] = useState<Record<string, FardoSelection>>({})

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return
    async function load() {
      const sb = supabase
      const { data: basketData } = await sb
        .from("baskets")
        .select("*, brand:brands!baskets_brand_id_fkey(id, name)")
        .eq("id", id)
        .eq("ativo", true)
        .single()
      if (!basketData) { setLoading(false); return }
      setBasket(basketData)

      const { data: itemsData } = await sb
        .from("basket_items")
        .select("*, product:products(id, name, sale_price, peso, volume, unidade, brand_id, brand:brands!products_brand_id_fkey(id, name))")
        .eq("basket_id", id)
        .order("product_id")
      setItems(itemsData ?? [])

      // Fetch product_brands for all products in this basket
      const productIds = (itemsData ?? []).map(i => i.product_id).filter(Boolean)
      if (productIds.length > 0) {
        const { data: pbs } = await sb
          .from("product_brands")
          .select("product_id, brand_id, sale_price, purchase_price, brand:brands!product_brands_brand_id_fkey(id, name)")
          .in("product_id", productIds)
          .eq("ativo", true)
        const normalized: ProductBrand[] = (pbs ?? []).map((pb: any) => ({
          product_id: pb.product_id,
          brand_id: pb.brand_id,
          sale_price: pb.sale_price,
          purchase_price: pb.purchase_price,
          brand: Array.isArray(pb.brand) ? pb.brand[0] : pb.brand,
        }))
        setProductBrands(normalized)
      }

      setLoading(false)
    }
    load()
  }, [id])

// Build per-product brand lists from product_brands
const allowedBrandsPerItem: Record<string, { id: string; name: string }[]> = {}
for (const pb of productBrands) {
  const brand = pb.brand
  if (brand && brand.id) {
    if (!allowedBrandsPerItem[pb.product_id]) allowedBrandsPerItem[pb.product_id] = []
    if (!allowedBrandsPerItem[pb.product_id].some(b => b.id === brand.id)) {
      allowedBrandsPerItem[pb.product_id].push(brand)
    }
  }
}

// Also include the product's default brand as a fallback
for (const item of items) {
  const prod = Array.isArray(item.product) ? item.product[0] : item.product
  const productBrand = prod?.brand ? (Array.isArray(prod.brand) ? prod.brand[0] : prod.brand) : null
  if (productBrand && productBrand.id) {
    const pid = item.product_id
    if (!allowedBrandsPerItem[pid]) allowedBrandsPerItem[pid] = []
    if (!allowedBrandsPerItem[pid].some(b => b.id === productBrand.id)) {
      allowedBrandsPerItem[pid].push(productBrand)
    }
  }
}

  // Initialize selections when items and brands are loaded
  useEffect(() => {
    if (items.length === 0 || basket?.tipo !== "FARDO") return
    const initial: Record<string, FardoSelection> = {}
    for (const item of items) {
      const prod = Array.isArray(item.product) ? item.product[0] : item.product
      const brands = allowedBrandsPerItem[item.product_id] || []
      const firstBrand = brands.length > 0 ? brands[0] : null
      initial[item.product_id] = {
        product_id: item.product_id,
        quantity: item.quantity,
        chosen_brand_id: brands.length === 1 ? (firstBrand?.id || "") : "",
        brand_name: brands.length === 1 ? (firstBrand?.name || "") : "",
      }
    }
    setFardoSelections(initial)
  }, [items, productBrands, basket?.tipo])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#006B2E] border-t-transparent"></div></div>
  if (!basket) return <div className="min-h-screen flex items-center justify-center text-[#8c9c91]">Cesta não encontrada.</div>

  const isFardo = basket.tipo === "FARDO"

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  // All unique brands across all items (for the brandMap display)
  const brandMap = new Map<string, { id: string; name: string }>()
  for (const brands of Object.values(allowedBrandsPerItem)) {
    for (const b of brands) {
      if (!brandMap.has(b.id)) brandMap.set(b.id, b)
    }
  }

  const handleFardoUpdateBrand = (productId: string, brandId: string, brandName: string) => {
    setFardoSelections(prev => ({
      ...prev,
      [productId]: { ...prev[productId], chosen_brand_id: brandId, brand_name: brandName }
    }))
  }

  const handleFardoUpdateQty = (productId: string, delta: number) => {
    setFardoSelections(prev => {
      const current = prev[productId]
      if (!current) return prev
      const newQty = Math.max(1, current.quantity + delta)
      return { ...prev, [productId]: { ...current, quantity: newQty } }
    })
  }

  // Validate that all products with 2+ brands have a brand selected
  const hasAllBrandsSelected = isFardo
    ? Object.entries(allowedBrandsPerItem).every(([prodId, brands]) => {
        if (brands.length <= 1) return true
        const sel = fardoSelections[prodId]
        return sel && !!sel.chosen_brand_id
      })
    : true

  const handleAddToCart = () => {
    if (isFardo) {
      const totalPrice = items.reduce((sum, item) => {
        const prod = Array.isArray(item.product) ? item.product[0] : item.product
        const sel = fardoSelections[item.product_id]
        const brandPrice = sel?.chosen_brand_id
          ? productBrands.find(pb => pb.product_id === item.product_id && pb.brand_id === sel.chosen_brand_id)?.sale_price
          : null
        const unitPrice = brandPrice ?? Number(prod?.sale_price || 0)
        return sum + unitPrice * (sel?.quantity || item.quantity)
      }, 0)
      addItem({
        id: `fardo_${basket.id}_${Date.now()}`,
        product_id: basket.id,
        product_name: basket.name,
        quantity: 1,
        unit_price: totalPrice,
        total_price: totalPrice,
        basket_id: basket.id,
        basket_name: basket.name,
        image_url: basket.image_url,
        is_basket_item: true,
        items: items.map(i => {
          const sel = fardoSelections[i.product_id]
          const prod = Array.isArray(i.product) ? i.product[0] : i.product
          const brandName = sel?.brand_name || prod?.brand?.name || ""
          const specs = [prod?.peso, prod?.volume, prod?.unidade].filter(Boolean).join(" · ")
          return {
            product_id: i.product_id,
            quantity: sel?.quantity || i.quantity,
            chosen_brand_id: sel?.chosen_brand_id || "",
            brand_name: brandName,
            specs,
          }
        }),
      })
    } else {
      const totalPrice = items.reduce((sum, item) => {
        const prod = Array.isArray(item.product) ? item.product[0] : item.product
        return sum + Number(prod?.sale_price || 0) * item.quantity
      }, 0)
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
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      })
    }
    setAdded(true)
  }

  const handleWhatsApp = async () => {
    try {
      const selections = isFardo
        ? Object.values(fardoSelections).map(s => {
            const item = items.find(i => i.product_id === s.product_id)
            const prod = item ? (Array.isArray(item.product) ? item.product[0] : item.product) : null
            const brandStr = s.brand_name ? ` (${s.brand_name})` : ""
            return `  - ${prod?.name}${brandStr} x${s.quantity}`
          }).join("\n")
        : items.map(i => {
            const prod = Array.isArray(i.product) ? i.product[0] : i.product
            return `  - ${prod?.name} x${i.quantity}`
          }).join("\n")

      const text = [
        `Olá.`,
        ``,
        `Tenho interesse em adquirir "${basket.name}" pelo site Cesta Para Todos.`,
        ``,
        `Meu nome é ${clientName || "[seu nome]"}.`,
        ``,
        `Itens:`,
        selections,
        ``,
        `Aguardo o retorno para mais informações.`,
      ].join("\n")
      const phone = await getWhatsAppPhone()
      if (phone) window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, "_blank")
    } catch { /* silently ignore — user can still copy the number manually */ }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#eef7f0] to-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/#cestas" className="text-sm text-[#006B2E] font-semibold hover:underline mb-4 inline-block">
          ← Voltar ao catálogo
        </Link>

        <div className="rounded-2xl border border-[#dfe7dd] bg-white shadow-sm overflow-hidden">
          {basket.image_url ? (
            <div className="w-full aspect-video bg-[#f5f7f2]">
              <img src={basket.image_url} alt={basket.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-full aspect-video bg-[#f5f7f2] flex items-center justify-center">
              <PackageOpen className="h-20 w-20 text-[#006B2E] opacity-40" />
            </div>
          )}

          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline" className="border-[#006B2E] text-[#006B2E] font-bold uppercase text-xs">
                    {formatTipo(basket.tipo)}
                  </Badge>
                  {isFardo && basket.brand?.name && (
                    <Badge variant="secondary" className="text-xs">{Array.isArray(basket.brand) ? basket.brand[0]?.name : basket.brand?.name}</Badge>
                  )}
                </div>
                <h1 className="text-3xl font-extrabold text-[#102016]">{basket.name}</h1>
                {basket.description && (
                  <p className="mt-2 text-sm text-[#526157] leading-relaxed">{basket.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-[#8c9c91]">{totalItems} itens inclusos</div>
              </div>
            </div>

            <div className="border-t border-[#dfe7dd] pt-6 space-y-4">
              <h2 className="text-lg font-black text-[#102016]">
                {isFardo ? "Personalize seu Fardo" : `Itens inclusos (${totalItems})`}
              </h2>
              {isFardo && (
                <p className="text-sm text-[#526157]">Escolha a marca e a quantidade desejada para cada produto.</p>
              )}
              {!isFardo && (
                <p className="text-xs leading-relaxed text-[#8c9c91] bg-[#f9fbf9] rounded-lg p-3 border border-[#dfe7dd]">
                  As marcas dos produtos podem variar de acordo com a disponibilidade em estoque, mantendo sempre a qualidade e as especificações do item.
                </p>
              )}
              <div className="divide-y divide-[#f0f4f0] rounded-xl border border-[#dfe7dd]">
                {items.map((item) => {
                  const prod = Array.isArray(item.product) ? item.product[0] : item.product
                  const specs = [prod?.peso, prod?.volume, prod?.unidade].filter(Boolean).join(" · ")
                  const brands = allowedBrandsPerItem[item.product_id] || []
                  const sel = fardoSelections[item.product_id]
                  const showBrandSelector = brands.length > 1
                  const hasSingleBrand = brands.length === 1

                  return (
                    <div key={item.product_id} className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-bold text-[#102016]">{prod?.name || "Produto removido"}</p>
                        {hasSingleBrand && !showBrandSelector && (
                          <p className="text-xs text-[#526157]">{brands[0].name}</p>
                        )}
                        {specs && <p className="text-xs text-[#8c9c91]">{specs}</p>}

                        {isFardo && (
                          <div className="mt-2 space-y-2">
                            {showBrandSelector && (
                              <div>
                                <label className="text-[10px] font-black text-[#526157] uppercase tracking-wider block mb-1">Selecione a marca *</label>
                                <select
                                  value={sel?.chosen_brand_id || ""}
                                  onChange={(e) => {
                                    const b = brands.find(b => b.id === e.target.value)
                                    handleFardoUpdateBrand(item.product_id, e.target.value, b?.name || "")
                                  }}
                                  className="text-xs font-semibold rounded-md border border-[#dfe7dd] bg-white p-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#006B2E] w-full max-w-[200px]"
                                >
                                  <option value="">Selecione uma marca</option>
                                  {brands.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-[#526157] uppercase tracking-wider">Qtd:</span>
                              <button
                                onClick={() => handleFardoUpdateQty(item.product_id, -1)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-[#dfe7dd] bg-white text-gray-500 hover:bg-gray-50 active:scale-95 transition-all"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-extrabold text-[#102016]">{sel?.quantity || item.quantity}</span>
                              <button
                                onClick={() => handleFardoUpdateQty(item.product_id, 1)}
                                className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#006B2E] text-white hover:bg-[#005324] active:scale-95 transition-all"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <span className="font-bold text-[#006B2E]">x{item.quantity}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {brandMap.size > 0 && basket.tipo === "CESTA_PERSONALIZADA" && (
              <div className="border-t border-[#dfe7dd] pt-6 space-y-4">
                <h2 className="text-lg font-black text-[#102016]">Marcas disponíveis</h2>
                <div className="flex flex-wrap gap-2">
                  {Array.from(brandMap.values()).map((b) => (
                    <Badge key={b.id} variant="outline" className="text-xs">{b.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-[#dfe7dd] pt-6 space-y-3">
              <input
                value={clientName} onChange={e => setClientName(e.target.value)}
                placeholder="Seu nome para o pedido"
                className="w-full rounded-lg border border-[#dfe7dd] px-4 py-2.5 text-sm font-medium text-[#102016] placeholder:text-[#8c9c91] outline-none focus:border-[#006B2E] focus:ring-1 focus:ring-[#006B2E]"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleAddToCart} disabled={added || !hasAllBrandsSelected} className="flex-1 bg-[#006B2E] text-white py-3 rounded-xl font-bold hover:bg-[#005324]">
                  <ShoppingCart className="h-4 w-4 mr-2" /> {added ? "Adicionado!" : !hasAllBrandsSelected ? "Selecione as marcas" : "Adicionar ao Carrinho"}
                </Button>
                <Button onClick={handleWhatsApp} className="flex-1 bg-[#FF6A00] text-white py-3 rounded-xl font-bold hover:bg-[#e85f00]">
                  <MessageCircle className="h-4 w-4 mr-2" /> Comprar pelo WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
