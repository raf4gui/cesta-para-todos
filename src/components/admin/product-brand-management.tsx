"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { supabase } from "@/lib/supabase"
import { listProductBrands, saveProductBrands } from "@/app/admin/produtos/actions"
import { Plus, Trash2 } from "lucide-react"

interface ProductBrand {
  id?: string
  brand_id: string
  brand?: { id: string; name: string }
  sale_price: number
  purchase_price: number
  stock: number
  ativo: boolean
}

export function ProductBrandManagement({ productId }: { productId?: string }) {
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([])
  const [selected, setSelected] = useState<ProductBrand[]>([])
  const [loading, setLoading] = useState(false)

  const loadBrands = useCallback(async () => {
    const { data } = await supabase.from("brands").select("id, name").eq("ativo", true).order("name")
    if (data) setBrands(data)
  }, [])

  const loadProductBrands = useCallback(async () => {
    if (!productId) return
    const data = await listProductBrands(productId)
    setSelected(data.map((pb: any) => ({
      id: pb.id,
      brand_id: pb.brand_id,
      brand: pb.brand || { id: pb.brand_id, name: "" },
      sale_price: Number(pb.sale_price) || 0,
      purchase_price: Number(pb.purchase_price) || 0,
      stock: Number(pb.stock) || 0,
      ativo: pb.ativo,
    })))
  }, [productId])

  useEffect(() => { loadBrands(); if (productId) loadProductBrands() }, [loadBrands, loadProductBrands, productId])

  const addBrand = (brandId: string) => {
    if (selected.some(s => s.brand_id === brandId)) return
    setSelected([...selected, {
      brand_id: brandId,
      brand: brands.find(b => b.id === brandId),
      sale_price: 0, purchase_price: 0, stock: 0, ativo: true,
    }])
  }

  const removeBrand = (brandId: string) => {
    setSelected(selected.filter(s => s.brand_id !== brandId))
  }

  const updateBrand = (brandId: string, field: string, value: any) => {
    setSelected(selected.map(s => s.brand_id === brandId ? { ...s, [field]: value } : s))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (!productId) return
      await saveProductBrands(productId, selected.map(s => ({
        brand_id: s.brand_id,
        sale_price: s.sale_price,
        purchase_price: s.purchase_price,
        stock: s.stock,
        ativo: s.ativo,
      })))
    } finally { setLoading(false) }
  }

  const availableBrands = brands.filter(b => !selected.some(s => s.brand_id === b.id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#102016]">Marcas do Produto</h3>
        {productId && (
          <Button type="button" size="sm" onClick={handleSave} disabled={loading} variant="outline">
            {loading ? "Salvando..." : "Salvar Marcas"}
          </Button>
        )}
      </div>

      {availableBrands.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableBrands.map(b => (
            <Button key={b.id} type="button" size="sm" variant="outline" onClick={() => addBrand(b.id)}>
              <Plus className="h-3 w-3 mr-2" />{b.name}
            </Button>
          ))}
        </div>
      )}

      {selected.length === 0 && (
        <p className="text-sm text-[#8c9c91]">Nenhuma marca vinculada. Clique em uma marca acima para adicionar.</p>
      )}

      {selected.length > 0 && (
        <div className="space-y-3">
          {selected.map(s => (
            <div key={s.brand_id} className="border rounded-lg p-3 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{s.brand?.name || "Carregando..."}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={s.ativo} onCheckedChange={(v) => updateBrand(s.brand_id, "ativo", v)} />
                    Ativo
                  </label>
                  <Button type="button" size="sm" variant="ghost" className="text-red-500" onClick={() => removeBrand(s.brand_id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[#8c9c91]">Preço Venda</label>
                  <Input type="number" step="0.01" value={s.sale_price} onChange={(e) => updateBrand(s.brand_id, "sale_price", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-[#8c9c91]">Preço Compra</label>
                  <Input type="number" step="0.01" value={s.purchase_price} onChange={(e) => updateBrand(s.brand_id, "purchase_price", Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-[#8c9c91]">Estoque</label>
                  <Input type="number" value={s.stock} onChange={(e) => updateBrand(s.brand_id, "stock", Number(e.target.value))} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
