"use client"

import { Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createCustomer, updateCustomer } from "@/app/admin/clientes/actions"
import { useState } from "react"
import { useAdminForm } from "@/lib/use-admin-form"

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  whatsapp: z.string().optional().or(z.literal("")),
  cpf_cnpj: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  ativo: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>

interface Props { initialData?: Partial<FormValues> & { id?: string } }

const DEFAULTS: FormValues = { name: "", phone: "", whatsapp: "", cpf_cnpj: "", address: "", city: "", notes: "", ativo: true }

export function CustomerForm({ initialData }: Props) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const { register, control, errors, isSubmitting, submit, validationSummary } = useAdminForm({
    schema: formSchema,
    defaultValues: DEFAULTS,
    initialData,
    onUpdate: async (id, data) => {
      try {
        await updateCustomer(id, data)
        setFeedback({ type: "success", message: "Cliente salvo!" })
        setTimeout(() => router.push("/admin/clientes"), 600)
      } catch (error: any) {
        setFeedback({ type: "error", message: error.message || "Erro ao salvar." })
      }
    },
    onCreate: async (data) => {
      try {
        await createCustomer(data)
        setFeedback({ type: "success", message: "Cliente salvo!" })
        setTimeout(() => router.push("/admin/clientes"), 600)
      } catch (error: any) {
        setFeedback({ type: "error", message: error.message || "Erro ao salvar." })
      }
    },
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {feedback && <div className={`rounded-lg border p-3 text-sm font-medium ${feedback.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>{feedback.message}</div>}

      {validationSummary && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-medium text-red-700">
          {validationSummary}
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-base font-bold border-b pb-2 text-[#102016]">Informações Pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1 text-[#102016]">Nome *</label><Input {...register("name")} placeholder="Nome completo" />{errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1 text-[#102016]">Telefone *</label><Input {...register("phone")} placeholder="(xx) xxxxx-xxxx" />{errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>}</div>
          <div><label className="block text-sm font-medium mb-1 text-[#102016]">WhatsApp</label><Input {...register("whatsapp")} placeholder="(xx) xxxxx-xxxx" /></div>
          <div><label className="block text-sm font-medium mb-1 text-[#102016]">CPF/CNPJ</label><Input {...register("cpf_cnpj")} placeholder="000.000.000-00" /></div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold border-b pb-2 text-[#102016]">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><label className="block text-sm font-medium mb-1 text-[#102016]">Endereço</label><Input {...register("address")} placeholder="Rua, número, bairro" /></div>
          <div><label className="block text-sm font-medium mb-1 text-[#102016]">Cidade</label><Input {...register("city")} placeholder="Cidade - UF" /></div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-bold border-b pb-2 text-[#102016]">Observações</h3>
        <Textarea {...register("notes")} placeholder="Informações adicionais..." rows={3} />
      </div>

      {initialData?.id && (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Controller name="ativo" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
          <span className="text-sm font-medium">Cliente ativo</span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="bg-[#006B2E] text-white hover:bg-[#005324]">{isSubmitting ? "Salvando..." : initialData?.id ? "Atualizar" : "Cadastrar"}</Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/clientes")}>Cancelar</Button>
      </div>
    </form>
  )
}
