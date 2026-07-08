"use client"

import { useEffect, useState, useRef } from "react"
import { Controller, type Control } from "react-hook-form"
import { z } from "zod"
import { optionalUuid } from "@/lib/zod-helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { createBasket, updateBasket, saveBasketItems, listAllBrands } from "@/app/admin/cestas/actions"
import { BasketItemManagement } from "./basket-item-management"
import { useAdminForm } from "@/lib/use-admin-form"

const BasketFormSchema = z.object({
  name: z.string().min(1, "Nome da cesta é obrigatório"),
  description: z.string().optional(),
  image_url: z.string().url("URL da imagem inválida").optional().or(z.literal("")),
  price: z.number().nonnegative().default(0),
  internal_price: z.number().nonnegative().optional().nullable(),
  show_price: z.boolean().default(true),
  show_catalog: z.boolean().default(true),
  ativo: z.boolean(),
  tipo: z.enum(["CESTA_PRATICA", "CESTA_COMPLETA", "CESTAO_FAMILIA", "CESTA_PERSONALIZADA", "KIT", "FARDO"]),
  brand_id: optionalUuid(),
  quantidade_fardo: z.number().int().positive().optional().nullable(),
  items: z.array(z.object({
    product_id: z.string().uuid("Produto inválido"),
    quantity: z.number().int().min(1, "Mínimo 1"),
    is_customizable: z.boolean(),
    allowed_brand_ids: z.array(z.string().uuid()).optional()
  }))
})

export type BasketFormValues = z.infer<typeof BasketFormSchema>

const DEFAULTS: BasketFormValues = {
  name: "", description: "", image_url: "",
  price: 0, internal_price: null,
  show_price: true, show_catalog: true, ativo: true,
  tipo: "CESTA_PRATICA", brand_id: "",
  quantidade_fardo: undefined as any, items: [],
}

export default function BasketForm({ initialData, redirectPath = "/admin/cestas" }: { initialData?: Partial<BasketFormValues> & { id?: string }; redirectPath?: string }) {
  const router = useRouter()
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { control, errors, isSubmitting, watch, setValue, submit, validationSummary } = useAdminForm({
    schema: BasketFormSchema,
    defaultValues: DEFAULTS,
    initialData,
    onUpdate: async (id, data) => {
      try {
        setFeedback(null)
        // Strip items from basket metadata update (items saved separately)
        const { items: _, ...meta } = data as any
        const basketId = initialData?.id

        // Clean quantity value
        if (meta.quantidade_fardo !== undefined && meta.quantidade_fardo !== null) {
          meta.quantidade_fardo = Number(meta.quantidade_fardo) || undefined
        }

        if (Object.keys(meta).length > 0) {
          await updateBasket(id, meta)
        }

        // Save items separately
        const currentItems = watch("items")
        if (basketId) {
          if (selectedTipo !== "CESTA_PERSONALIZADA" && currentItems) {
            await saveBasketItems(basketId, currentItems)
          } else {
            await saveBasketItems(basketId, [])
          }
        }
        setFeedback({ type: "success", message: "Salvo com sucesso!" })
        setTimeout(() => router.push(redirectPath), 800)
      } catch (error: any) {
        setFeedback({ type: "error", message: error.message || "Erro ao salvar." })
      }
    },
    onCreate: async (data) => {
      try {
        setFeedback(null)
        const { items, ...basketData } = data as any
        if (basketData.quantidade_fardo !== undefined && basketData.quantidade_fardo !== null) {
          basketData.quantidade_fardo = Number(basketData.quantidade_fardo) || undefined
        }
        const newBasket = await createBasket(basketData as any)
        if (selectedTipo !== "CESTA_PERSONALIZADA" && items) {
          await saveBasketItems(newBasket.id, items)
        }
        setFeedback({ type: "success", message: "Criado com sucesso!" })
        setTimeout(() => router.push(redirectPath), 800)
      } catch (error: any) {
        setFeedback({ type: "error", message: error.message || "Erro ao salvar." })
      }
    },
  })

  const imageUrl = watch("image_url")
  const selectedTipo = watch("tipo")

  useEffect(() => {
    async function fetchBrands() {
      try {
        const activeBrands = await listAllBrands()
        setBrands(activeBrands)
      } catch (err) {
        console.error("Erro ao carregar marcas no formulário de cestas:", err)
      }
    }
    fetchBrands()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError("")
    setIsUploading(true)
    try {
      const allowed = ["image/jpeg", "image/png", "image/webp"]
      if (!allowed.includes(file.type)) {
        throw new Error(`Formato não aceito: ${file.type || "desconhecido"}. Use JPG, JPEG, PNG ou WEBP.`)
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo: 10MB.`)
      }

      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Erro no upload.")
      setValue("image_url", json.url)
    } catch (err: any) { setUploadError(err.message || "Erro inesperado no upload.") }
    finally {
      setIsUploading(false)
      if (e.target) e.target.value = ""
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6 max-w-2xl bg-card border p-6 rounded-xl shadow-sm">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#102016]">Informações do Item de Catálogo</h2>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="name">Nome / Título</label>
          <Input id="name" {...control.register("name")} disabled={isSubmitting} placeholder="Ex: Cesta Prática, Fardo de Refrigerante..." />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="description">Descrição</label>
          <Textarea id="description" {...control.register("description")} disabled={isSubmitting} placeholder="Ex: Composto por 24 unidades de..." />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Imagem</label>
          <div className="flex items-start gap-4">
            {imageUrl && (
              <div className="w-24 h-24 rounded-lg overflow-hidden border flex-shrink-0 bg-muted">
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Input type="text" {...control.register("image_url")} disabled={isSubmitting} placeholder="https://..." />
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
              <Button type="button" variant="outline" size="sm" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                {isUploading ? "Enviando..." : "Upload de imagem"}
              </Button>
              {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
            </div>
          </div>
          {errors.image_url && <p className="text-sm text-destructive">{errors.image_url.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="price">Preço de Venda (Público)</label>
            <Input id="price" type="number" step="0.01" {...control.register("price", { valueAsNumber: true })} disabled={isSubmitting} />
            {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground" htmlFor="internal_price">Preço Interno (Custo)</label>
            <Input id="internal_price" type="number" step="0.01" {...control.register("internal_price", { valueAsNumber: true })} disabled={isSubmitting} />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 border p-3 rounded-lg">
            <Controller name="show_price" control={control} render={({ field }) => <Switch id="show_price" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />} />
            <label htmlFor="show_price" className="text-sm font-medium cursor-pointer">Mostrar Preço no Site</label>
          </div>
          <div className="flex items-center space-x-2 border p-3 rounded-lg">
            <Controller name="show_catalog" control={control} render={({ field }) => <Switch id="show_catalog" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />} />
            <label htmlFor="show_catalog" className="text-sm font-medium cursor-pointer">Mostrar no Catálogo</label>
          </div>
          <div className="flex items-center space-x-2 border p-3 rounded-lg">
            <Controller name="ativo" control={control} render={({ field }) => <Switch id="ativo" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />} />
            <label htmlFor="ativo" className="text-sm font-medium cursor-pointer">Ativo</label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="tipo">Tipo de Cesta</label>
          <Controller name="tipo" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="tipo" className="w-full">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CESTA_PRATICA">Cesta Prática</SelectItem>
                <SelectItem value="CESTA_COMPLETA">Cesta Completa</SelectItem>
                <SelectItem value="CESTAO_FAMILIA">Cestão Família</SelectItem>
                <SelectItem value="CESTA_PERSONALIZADA">Cesta Personalizada (Montada pelo cliente)</SelectItem>
                <SelectItem value="KIT">Kit</SelectItem>
                <SelectItem value="FARDO">Fardo</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
      </div>

      {selectedTipo !== "CESTA_PERSONALIZADA" && (
        <>
          <hr className="border-border my-6" />
          <div className="space-y-4">
            <BasketItemManagement control={control as any} setValue={setValue} watch={watch} tipo={selectedTipo} />
          </div>
        </>
      )}

      {feedback && (
        <div className={`rounded-xl border p-4 text-sm font-medium ${feedback.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {feedback.message}
        </div>
      )}

      {validationSummary && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-700">
          {validationSummary}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/cestas")} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-[#006B2E] text-white hover:bg-[#005324]">
          {isSubmitting ? "Salvando..." : initialData?.id ? "Salvar Item" : "Criar Item"}
        </Button>
      </div>
    </form>
  )
}
