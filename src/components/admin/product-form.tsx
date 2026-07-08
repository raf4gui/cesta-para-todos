"use client"

import { useEffect, useState, useRef } from "react"
import { Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { optionalUuid } from "@/lib/zod-helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProduct, updateProduct, listFormBrands, listFormCategories, listProductBrandIds } from "@/app/admin/produtos/actions"
import { uploadProductImage } from "@/app/admin/cestas/actions"
import { ProductBrandManagement } from "@/components/admin/product-brand-management"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { useAdminForm } from "@/lib/use-admin-form"

const formSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().optional().or(z.literal("")),
  image_url: z.string().optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0, "Mínimo 0"),
  price: z.coerce.number().min(0, "Mínimo 0").default(0),
  purchase_price: z.coerce.number().min(0, "Mínimo 0").default(0),
  sale_price: z.coerce.number().min(0, "Mínimo 0").default(0),
  brand_id: optionalUuid(),
  category_id: optionalUuid(),
  ativo: z.boolean().default(true),
  disponivel: z.boolean().default(true),
  peso: z.string().optional().or(z.literal("")),
  volume: z.string().optional().or(z.literal("")),
  unidade: z.string().optional().or(z.literal("")),
  vendido_individualmente: z.boolean().default(true),
  faz_parte_de_cesta: z.boolean().default(false),
  faz_parte_de_fardo: z.boolean().default(false),
  internal_code: z.string().optional().or(z.literal("")),
  barcode: z.string().optional().or(z.literal("")),
  min_stock: z.coerce.number().int().min(0).default(5),
  supplier: z.string().optional().or(z.literal("")),
  oculto_catalogo: z.boolean().default(false),
  internal_cost: z.coerce.number().min(0).default(0),
  show_price: z.boolean().default(true),
  allow_personalization: z.boolean().default(false),
  featured: z.boolean().default(false),
})

export type FormValues = z.infer<typeof formSchema>

interface Props {
  initialData?: Partial<FormValues> & { id?: string }
}

const DEFAULTS: FormValues = {
  name: "", description: "", image_url: "", stock: 0, price: 0,
  purchase_price: 0, sale_price: 0,
  brand_id: "", category_id: undefined as any,
  ativo: true, disponivel: true,
  peso: "", volume: "", unidade: "",
  vendido_individualmente: true, faz_parte_de_cesta: false, faz_parte_de_fardo: false,
  internal_code: "", barcode: "", min_stock: 5, supplier: "",
  oculto_catalogo: false, internal_cost: 0,
  show_price: true, allow_personalization: false, featured: false,
}

export function ProductForm({ initialData }: Props) {
  const router = useRouter()
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([])
  const [uploadError, setUploadError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const MAX_IMG_DIM = 1920

  const { register, control, errors, isSubmitting, watch, setValue, submit } = useAdminForm({
    schema: formSchema,
    defaultValues: DEFAULTS,
    initialData,
    onUpdate: async (id, data) => {
      try {
        setFeedback(null)
        await updateProduct(id, { ...data, brand_ids: selectedBrandIds })
        setFeedback({ type: "success", message: "Produto salvo com sucesso!" })
        setTimeout(() => router.push("/admin/produtos"), 600)
      } catch (error: any) {
        setFeedback({ type: "error", message: error.message || "Erro ao salvar." })
      }
    },
    onCreate: async (data) => {
      try {
        setFeedback(null)
        await createProduct({ ...data, brand_ids: selectedBrandIds })
        setFeedback({ type: "success", message: "Produto criado com sucesso!" })
        setTimeout(() => router.push("/admin/produtos"), 600)
      } catch (error: any) {
        setFeedback({ type: "error", message: error.message || "Erro ao salvar." })
      }
    },
  })

  const imageUrl = watch("image_url")
  const purchasePrice = watch("purchase_price")
  const salePrice = watch("sale_price")

  useEffect(() => {
    listFormBrands().then(setBrands)
    listFormCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (!initialData?.id) return
    listProductBrandIds(initialData.id).then(setSelectedBrandIds)
  }, [initialData?.id])

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

      let uploadFile = file
      if (file.size > 1024 * 1024) {
        const canvas = document.createElement("canvas")
        const bitmap = await createImageBitmap(file)
        let w = bitmap.width, h = bitmap.height
        if (w > MAX_IMG_DIM || h > MAX_IMG_DIM) {
          const ratio = Math.min(MAX_IMG_DIM / w, MAX_IMG_DIM / h)
          w = Math.round(w * ratio); h = Math.round(h * ratio)
        }
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(bitmap, 0, 0, w, h)
        const quality = file.size > 5 * 1024 * 1024 ? 0.6 : 0.8
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality))
        if (blob) uploadFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })
      }

      const formData = new FormData()
      formData.append("file", uploadFile)
      const url = await uploadProductImage(formData)
      setValue("image_url", url)
    } catch (err: any) { setUploadError(err.message || "Erro inesperado no upload.") }
    finally {
      setIsUploading(false)
      if (e.target) e.target.value = ""
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {feedback && (
        <div className={`rounded-lg border p-3 text-sm font-medium ${feedback.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {feedback.message}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-base font-bold border-b pb-2 text-[#102016]">Informações do Produto</h3>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">Nome *</label>
          <Input id="name" {...register("name")} placeholder="Ex: Arroz Tipo 1 5kg" />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="description">Descrição</label>
          <Textarea id="description" {...register("description")} placeholder="Detalhes do produto..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <Controller name="category_id" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger className={errors.category_id ? "border-red-500" : ""}><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Marca</label>
            <Controller name="brand_id" control={control} render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem marca</SelectItem>
                  {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Peso</label>
            <Input placeholder="Ex: 1kg" {...register("peso")} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Volume</label>
            <Input placeholder="Ex: 2L" {...register("volume")} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unidade</label>
            <Input placeholder="Pacote, Unidade" {...register("unidade")} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold border-b pb-2 text-[#102016]">Codificação</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Código Interno</label>
            <Input placeholder="Ex: PROD-001" {...register("internal_code")} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Código de Barras</label>
            <Input placeholder="Ex: 7891234567890" {...register("barcode")} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold border-b pb-2 text-[#102016]">Preços</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Preço de Compra (R$)</label>
            <Input type="number" step="0.01" {...register("purchase_price", { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preço de Venda (R$)</label>
            <Input type="number" step="0.01" {...register("sale_price", { valueAsNumber: true })} />
          </div>
        </div>
        {purchasePrice > 0 && salePrice > 0 && (
          <div className="flex gap-4 text-sm text-[#526157] bg-[#fcfdfa] p-3 rounded-lg">
            <span>Lucro: <strong className="text-green-600">R$ {(salePrice - purchasePrice).toFixed(2)}</strong></span>
            <span>Margem: <strong className="text-green-600">{((salePrice - purchasePrice) / salePrice * 100).toFixed(1)}%</strong></span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Preço Interno (R$)</label>
            <Input type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Custo Interno (R$)</label>
            <Input type="number" step="0.01" {...register("internal_cost", { valueAsNumber: true })} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold border-b pb-2 text-[#102016]">Estoque</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Estoque Atual</label>
            <Input type="number" {...register("stock", { valueAsNumber: true })} />
            {errors.stock && <p className="text-sm text-red-500 mt-1">{errors.stock.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estoque Mínimo</label>
            <Input type="number" {...register("min_stock", { valueAsNumber: true })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fornecedor</label>
          <Input placeholder="Nome do fornecedor" {...register("supplier")} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-bold border-b pb-2 text-[#102016]">Imagem do Produto</h3>
        <div className="flex gap-4 items-start">
          {imageUrl && (
            <div className="relative h-24 w-24 rounded-lg overflow-hidden border">
              <Image src={imageUrl} alt="Preview" fill className="object-cover" sizes="96px" />
              <button type="button" onClick={() => setValue("image_url", "")} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#006B2E]/50 hover:bg-[#006B2E]/5 transition-colors" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-5 w-5 mx-auto mb-1 text-gray-400" />
              <p className="text-sm text-gray-500">{isUploading ? "Enviando..." : "Clique para fazer upload"}</p>
              <p className="text-xs text-gray-400">PNG, JPG, WEBP</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
            <Input placeholder="Ou cole uma URL de imagem" {...register("image_url")} />
            {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-bold border-b pb-2 text-[#102016]">Comportamento</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: "ativo" as const, label: "Produto ativo" },
            { name: "disponivel" as const, label: "Disponível no catálogo" },
            { name: "vendido_individualmente" as const, label: "Vendido individualmente" },
            { name: "faz_parte_de_cesta" as const, label: "Faz parte de cestas" },
            { name: "faz_parte_de_fardo" as const, label: "Faz parte de fardos" },
            { name: "oculto_catalogo" as const, label: "Oculto do catálogo" },
            { name: "show_price" as const, label: "Mostrar preço no site" },
            { name: "allow_personalization" as const, label: "Permitir personalização" },
            { name: "featured" as const, label: "Destaque" },
          ].map(({ name, label }) => (
            <label key={name} className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-gray-50">
              <Controller name={name} control={control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold border-b pb-2 text-[#102016]">Marcas Disponíveis</h3>
        <p className="text-xs text-[#526157]">Selecione as marcas disponíveis para este produto.</p>
        {brands.length === 0 ? (
          <p className="text-sm text-[#8c9c91] italic">Nenhuma marca cadastrada.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {brands.map(b => {
              const isChecked = selectedBrandIds.includes(b.id)
              return (
                <label
                  key={b.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                    isChecked
                      ? "border-[#006B2E] bg-[#eef7ef] text-[#006B2E] font-semibold"
                      : "border-[#dfe7dd] bg-white text-[#526157] hover:border-[#b4c8b2]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setSelectedBrandIds(prev =>
                        isChecked ? prev.filter(id => id !== b.id) : [...prev, b.id]
                      )
                    }}
                    className="rounded border-gray-300 text-[#006B2E] focus:ring-[#006B2E]"
                  />
                  <span>{b.name}</span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {initialData?.id && (
        <div className="space-y-4 pt-4 border-t">
          <ProductBrandManagement productId={initialData.id} />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="bg-[#006B2E] text-white hover:bg-[#005324]">
          {isSubmitting ? "Salvando..." : initialData?.id ? "Atualizar Produto" : "Criar Produto"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/produtos")}>Cancelar</Button>
      </div>
    </form>
  )
}
