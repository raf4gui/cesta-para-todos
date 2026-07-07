"use client"

import { Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createBrand, updateBrand } from "@/app/admin/marcas/actions"
import { useState } from "react"
import { useAdminForm } from "@/lib/use-admin-form"

const BrandFormSchema = z.object({
  name: z.string().min(1, "Nome da marca é obrigatório"),
  description: z.string().optional().or(z.literal("")),
  logo: z.string().optional().or(z.literal("")),
  ativo: z.boolean(),
})

type BrandFormValues = z.infer<typeof BrandFormSchema>

interface BrandFormProps {
  initialData?: BrandFormValues & { id?: string }
}

const DEFAULTS: BrandFormValues = { name: "", description: "", logo: "", ativo: true }

export default function BrandForm({ initialData }: BrandFormProps) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const { register, control, errors, isSubmitting, submit } = useAdminForm({
    schema: BrandFormSchema,
    defaultValues: DEFAULTS,
    initialData,
    onUpdate: async (id, data) => {
      try {
        setFeedback(null)
        await updateBrand(id, data)
        setFeedback({ type: "success", message: "Marca atualizada com sucesso!" })
        setTimeout(() => router.push("/admin/marcas"), 1000)
      } catch (err) {
        console.error(err)
        setFeedback({ type: "error", message: "Erro ao salvar a marca. Tente novamente." })
      }
    },
    onCreate: async (data) => {
      try {
        setFeedback(null)
        await createBrand(data)
        setFeedback({ type: "success", message: "Marca criada com sucesso!" })
        setTimeout(() => router.push("/admin/marcas"), 1000)
      } catch (err) {
        console.error(err)
        setFeedback({ type: "error", message: "Erro ao salvar a marca. Tente novamente." })
      }
    },
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-6 max-w-lg">
      {feedback && (
        <div className={`rounded-lg p-3 text-sm font-medium ${feedback.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {feedback.message}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome da Marca</Label>
        <Input id="name" placeholder="Ex: Camil, Tio João..." {...register("name")} disabled={isSubmitting} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" {...register("description")} disabled={isSubmitting} placeholder="Descrição da marca" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="logo">URL da Logo</Label>
        <Input id="logo" {...register("logo")} disabled={isSubmitting} placeholder="https://..." />
      </div>

      <div className="flex items-center gap-3">
        <Controller
          name="ativo"
          control={control}
          render={({ field }) => (
            <Switch id="ativo" checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
          )}
        />
        <Label htmlFor="ativo">Marca ativa</Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="bg-[#006B2E] text-white hover:bg-[#005324]">
          {isSubmitting ? "Salvando..." : initialData?.id ? "Atualizar Marca" : "Criar Marca"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/marcas")} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
