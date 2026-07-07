"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, Package } from "lucide-react"
import { toggleProductStatus, reorderPersonalizationProducts } from "@/app/admin/produtos/actions"

interface Product {
  id: string
  name: string
  peso?: string | null
  volume?: string | null
  unidade?: string | null
  allow_personalization: boolean
  personalization_order: number
}

interface Props {
  products: Product[]
}

export function PersonalizationManager({ products: initial }: Props) {
  const [products, setProducts] = useState<Product[]>(() =>
    [...initial].sort((a, b) => a.personalization_order - b.personalization_order)
  )
  const router = useRouter()

  const handleToggle = useCallback(async (id: string, currentValue: boolean) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, allow_personalization: !currentValue } : p))
    try {
      await toggleProductStatus(id, "allow_personalization", !currentValue)
      router.refresh()
    } catch {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, allow_personalization: currentValue } : p))
    }
  }, [router])

  const moveUp = useCallback((index: number) => {
    if (index === 0) return
    setProducts(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]]
      return next
    })
  }, [])

  const moveDown = useCallback((index: number) => {
    setProducts(prev => {
      if (index >= prev.length - 1) return prev
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }, [])

  const handleSaveOrder = useCallback(async () => {
    await reorderPersonalizationProducts(products.map(p => p.id))
    router.refresh()
  }, [products, router])

  const enabledCount = products.filter(p => p.allow_personalization).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#526157]">
          {enabledCount} de {products.length} produtos ativados
        </p>
        <Button
          onClick={handleSaveOrder}
          size="sm"
          className="bg-[#006B2E] text-white hover:bg-[#005324]"
        >
          Salvar Ordem
        </Button>
      </div>

      <div className="rounded-xl border border-[#dfe7dd] bg-white overflow-hidden">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-[#8c9c91]">
            <Package className="h-12 w-12 mb-3 opacity-50" />
            <p className="font-semibold">Nenhum produto encontrado</p>
            <p className="text-sm">Crie produtos no menu Produtos para gerenciá-los aqui.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#dfe7dd]">
            {products.map((product, index) => {
              const specs = [product.peso, product.volume, product.unidade].filter(Boolean).join(" · ")
              return (
                <div key={product.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${product.allow_personalization ? "bg-white" : "bg-[#fafbfa]"}`}>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="h-5 w-5 flex items-center justify-center rounded text-[#8c9c91] hover:text-[#102016] hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para cima"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index >= products.length - 1}
                      className="h-5 w-5 flex items-center justify-center rounded text-[#8c9c91] hover:text-[#102016] hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para baixo"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${product.allow_personalization ? "text-[#102016]" : "text-[#8c9c91]"}`}>
                      {product.name}
                    </p>
                    {specs && (
                      <p className="text-xs text-[#8c9c91] mt-0.5">{specs}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${product.allow_personalization ? "text-[#006B2E]" : "text-[#8c9c91]"}`}>
                      {product.allow_personalization ? "Ativo" : "Inativo"}
                    </span>
                    <Switch
                      checked={product.allow_personalization}
                      onCheckedChange={() => handleToggle(product.id, product.allow_personalization)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
