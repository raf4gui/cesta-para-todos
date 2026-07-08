"use client"

import { useState } from "react"
import { Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createCategory, updateCategory } from "@/app/admin/categorias/actions"
import { useAdminForm } from "@/lib/use-admin-form"

const CategoryFormSchema = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório"),
  description: z.string().optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  ativo: z.boolean(),
})

type CategoryFormValues = z.infer<typeof CategoryFormSchema>

const DEFAULTS: CategoryFormValues = { name: "", description: "", image: "", ativo: true }

export default function CategoryForm({ initialData }: { initialData?: CategoryFormValues & { id?: string } }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const { register, control, errors, isSubmitting, submit, validationSummary } = useAdminForm({
    schema: CategoryFormSchema,
    defaultValues: DEFAULTS,
    initialData,
    onUpdate: async (id, data) => {
      try {
        setFeedback(null)
        await updateCategory(id, data)
        setFeedback({ type: "success", message: "Categoria atualizada com sucesso." })
        setTimeout(() => router.push("/admin/categorias"), 700)
      } catch (error) {
        console.error(error)
        setFeedback({ type: "error", message: "Erro ao salvar a categoria. Verifique os dados e tente novamente." })
      }
    },
    onCreate: async (data) => {
      try {
        setFeedback(null)
        await createCategory(data)
        setFeedback({ type: "success", message: "Categoria criada com sucesso." })
        setTimeout(() => router.push("/admin/categorias"), 700)
      } catch (error) {
        console.error(error)
        setFeedback({ type: "error", message: "Erro ao salvar a categoria. Verifique os dados e tente novamente." })
      }
    },
  })

  return (
    <form onSubmit={submit} noValidate className="max-w-lg space-y-6">
      {feedback && (
        <div className={`rounded-lg border p-3 text-sm font-medium ${feedback.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {feedback.message}
        </div>
      )}

      {validationSummary && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700">
          {validationSummary}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome da Categoria</Label>
        <Input id="name" placeholder="Ex: Cestas" {...register("name")} disabled={isSubmitting} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" {...register("description")} disabled={isSubmitting} placeholder="Descrição da categoria" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">URL da Imagem</Label>
        <Input id="image" {...register("image")} disabled={isSubmitting} placeholder="https://..." />
      </div>

      <div className="flex items-center gap-3">
        <Controller
          name="ativo"
          control={control}
          render={({ field }) => (
            <Switch id="ativo" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
          )}
        />
        <Label htmlFor="ativo">Categoria ativa</Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="bg-[#006B2E] text-white hover:bg-[#005324]">
          {isSubmitting ? "Salvando..." : initialData?.id ? "Atualizar Categoria" : "Criar Categoria"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/categorias")} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
