"use client"

import { useEffect, useState, useCallback } from "react"
import { getPublicCatalogItems } from "@/app/actions"
import { Badge } from "@/components/ui/badge"
import { PackageOpen, ArrowRight, ShoppingCart } from "lucide-react"
import CustomizerModal from "./customizer-modal"
import PredefinedOrderModal from "./predefined-order-modal"
import Link from "next/link"
import { useCart } from "@/lib/cart-context"
import { useRealtimeRefresh } from "@/lib/realtime-context"

interface CatalogItem {
  id: string
  name: string
  description?: string
  image_url?: string
  tipo: string
  brand_id?: string
  brand?: { name: string }
  quantidade_fardo?: number
}

interface CatalogCompositionItem {
  basket_id: string
  product_id: string
  quantity: number
  product: { name: string; peso?: string; volume?: string; unidade?: string; brand?: { name: string } }
}

export default function CatalogSection() {
  const { addItem } = useCart()
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [compositionItems, setCompositionItems] = useState<CatalogCompositionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)
  const [activeCustomBasket, setActiveCustomBasket] = useState<{ id: string; name: string } | null>(null)
  const [isPredefinedOpen, setIsPredefinedOpen] = useState(false)
  const [selectedBasket, setSelectedBasket] = useState<CatalogItem | null>(null)
  const [selectedComposition, setSelectedComposition] = useState<CatalogCompositionItem[]>([])

  const loadCatalog = useCallback(async () => {
    try {
      const data = await getPublicCatalogItems()
      const normalizedItems = (data.items ?? []).map((item: any) => ({
        ...item,
        brand: Array.isArray(item.brand) ? item.brand[0] ?? null : item.brand ?? null,
      })) as CatalogItem[]
      setCatalogItems(normalizedItems)

      const normalizedBasketItems = (data.basketItems ?? []).map((bi: any) => ({
        ...bi,
        product: bi.product ? { ...bi.product, brand: Array.isArray(bi.product.brand) ? bi.product.brand[0] ?? null : bi.product.brand ?? null } : bi.product,
      })) as CatalogCompositionItem[]
      setCompositionItems(normalizedBasketItems)

      const custom = data.items.find((i) => i.tipo === "CESTA_PERSONALIZADA")
      if (custom) setActiveCustomBasket({ id: custom.id, name: custom.name })
    } catch (err) {
      console.error("Erro ao carregar catálogo:", err)
      setError("Não foi possível carregar o catálogo. Tente novamente mais tarde.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCatalog()
  }, [loadCatalog])

  // Real-time sync via shared RealtimeProvider (eliminates duplicate subscriptions)
  const catalogVersion = useRealtimeRefresh("products", "baskets", "categories", "brands")
  useEffect(() => {
    if (catalogVersion > 0) loadCatalog()
  }, [catalogVersion, loadCatalog])

  const cestas = catalogItems.filter((item) =>
    ["CESTA_PRATICA", "CESTA_COMPLETA", "CESTAO_FAMILIA"].includes(item.tipo)
  )
  const customBaskets = catalogItems.filter((item) => item.tipo === "CESTA_PERSONALIZADA")
  const kits = catalogItems.filter((item) => item.tipo === "KIT")
  const fardos = catalogItems.filter((item) => item.tipo === "FARDO")

  const handleOpenPredefined = (basket: CatalogItem) => {
    const composition = compositionItems.filter((item) => item.basket_id === basket.id)
    setSelectedBasket(basket)
    setSelectedComposition(composition)
    setIsPredefinedOpen(true)
  }

  const renderProductCard = (item: CatalogItem) => {
    const composition = compositionItems.filter((c) => c.basket_id === item.id)
    return (
      <article key={item.id} className="group flex flex-col overflow-hidden rounded-2xl border border-[#dfe7dd] bg-white shadow-[0_10px_30px_rgba(19,44,26,0.04)] transition hover:-translate-y-1 hover:shadow-[0_22px_46px_rgba(19,44,26,0.1)]">
        <div className="relative aspect-[1.25] bg-[#f5f7f2] border-b">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-full items-center justify-center text-[#006B2E]"><PackageOpen className="h-16 w-16 opacity-70" /></div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between p-5 space-y-4">
          <div className="space-y-3">
            <h3 className="text-lg font-black leading-tight text-[#102016]">{item.name}</h3>
            {item.description && <p className="text-xs font-medium leading-relaxed text-[#526157]">{item.description}</p>}
            {composition.length > 0 && (
              <div className="space-y-1 pt-2">
                <span className="text-[10px] font-black text-[#526157] uppercase tracking-wider block">Itens inclusos:</span>
                <div className="max-h-24 overflow-y-auto text-[11px] font-semibold text-gray-600 space-y-0.5 pr-2">
                  {composition.map((c, idx) => {
                    const brandStr = c.product.brand?.name ? ` ${c.product.brand.name}` : ""
                    const specs = [c.product.peso, c.product.volume, c.product.unidade].filter(Boolean).join(" · ")
                    return (
                      <div key={idx} className="flex justify-between border-b border-[#f2faf3] py-0.5">
                        <span>{c.product.name}{brandStr}{specs ? ` (${specs})` : ""}</span>
                        <span className="text-[#006B2E] font-bold">x{c.quantity}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/cestas/${item.id}`}
              className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#f0f7f0] px-4 text-xs font-extrabold text-[#006B2E] border border-[#006B2E]/20 hover:bg-[#e0efe0] transition-colors">
              Ver detalhes
            </Link>
            {item.tipo === "FARDO" ? (
              <Link href={`/cestas/${item.id}`}
                className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#006B2E] px-4 text-xs font-extrabold text-white hover:bg-[#005324] transition-colors">
                <ShoppingCart className="h-3.5 w-3.5" /> Adicionar
              </Link>
            ) : (
              <button onClick={() => handleOpenPredefined(item)}
                className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#006B2E] px-4 text-xs font-extrabold text-white hover:bg-[#005324] transition-colors">
                <ShoppingCart className="h-3.5 w-3.5" /> Adicionar
              </button>
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <section id="cestas" className="relative py-14 md:py-20" style={{ background: "linear-gradient(180deg, #eef7f0 0%, #ffffff 50%, #f6faf6 100%)", borderTop: "1px solid rgba(0,107,46,0.12)" }}>
      <div id="produtos" className="absolute -mt-28 h-1 w-1" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div className="flex flex-col gap-6 border-b border-gray-200 pb-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <span className="text-sm font-bold uppercase tracking-widest text-[#FF6A00]">Catálogo</span>
            <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Nossos Combos e Opções de Cestas</h2>
            <p className="mt-4 max-w-2xl text-lg text-gray-500">
              Consulte nossos produtos, cestas prontas ou monte a sua cesta personalizada.
            </p>
          </div>
        </div>

        {isLoading && (
          <div className="mt-12 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-[380px] animate-pulse rounded-2xl border border-[#dfe7dd] bg-white" />)}
          </div>
        )}

        {!isLoading && error && (
          <div className="mt-10 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">{error}</div>
        )}

        {!isLoading && (
          <div className="mt-10 space-y-16">

            {/* Custom Basket Spotlight */}
            {customBaskets.map((cb) => (
              <div key={cb.id} id="customizer" className="relative overflow-hidden rounded-2xl border border-[#006B2E]/30 bg-gradient-to-br from-[#f6faf6] to-white p-6 md:p-10 shadow-[0_16px_40px_rgba(0,107,46,0.06)] flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <Badge className="bg-[#FF6A00] text-white hover:bg-[#FF6A00] uppercase font-black tracking-wider text-[10px] px-2.5 py-0.5">Destaque</Badge>
                    <Badge variant="outline" className="border-[#006B2E] text-[#006B2E] font-black uppercase text-[10px] px-2.5 py-0.5">Personalizável</Badge>
                  </div>
                  <h3 className="text-2xl font-extrabold text-gray-900 md:text-3xl">{cb.name}</h3>
                  <p className="text-base text-gray-600 max-w-2xl">
                    {cb.description || "Escolha os produtos e marcas de sua preferência. Monte a cesta ideal para sua casa (mínimo 25 itens)."}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button onClick={() => { setActiveCustomBasket({ id: cb.id, name: cb.name }); setIsCustomizerOpen(true) }}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#006B2E] px-8 text-sm font-black text-white hover:bg-[#005324] shadow-[0_8px_20px_rgba(0,107,46,0.2)] transition-all hover:scale-[1.02]">
                    Montar minha cesta personalizada <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Predefined Cestas */}
            <div id="ready-baskets" className="space-y-6">
              <h3 className="text-xl font-black text-[#102016] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#006B2E]"></span> Cestas Básicas Prontas
              </h3>
              {cestas.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{cestas.map(renderProductCard)}</div>
              ) : (
                <p className="text-sm text-[#8c9c91] italic py-4">Nenhuma cesta disponível no momento.</p>
              )}
            </div>

            {/* Kits */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-[#102016] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#006B2E]"></span> Kits
              </h3>
              {kits.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{kits.map(renderProductCard)}</div>
              ) : (
                <p className="text-sm text-[#8c9c91] italic py-4">Em breve novos kits estarão disponíveis.</p>
              )}
            </div>

            {/* Fardos */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-[#102016] flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#006B2E]"></span> Fardos
              </h3>
              {fardos.length > 0 ? (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">{fardos.map(renderProductCard)}</div>
              ) : (
                <p className="text-sm text-[#8c9c91] italic py-4">Em breve novos fardos estarão disponíveis.</p>
              )}
            </div>

          </div>
        )}
      </div>

      {activeCustomBasket && (
        <CustomizerModal isOpen={isCustomizerOpen} onClose={() => setIsCustomizerOpen(false)} basketId={activeCustomBasket.id} basketName={activeCustomBasket.name} />
      )}
      {selectedBasket && (
        <PredefinedOrderModal isOpen={isPredefinedOpen} onClose={() => setIsPredefinedOpen(false)} basket={selectedBasket} compositionItems={selectedComposition} />
      )}
    </section>
  )
}
