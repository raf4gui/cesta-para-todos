"use client"

import { useForm, Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { createFinancialEntry } from "@/app/admin/financeiro/actions"
import { useState } from "react"

const formSchema = z.object({
  entry_type: z.enum(["RECEITA", "DESPESA", "CUSTO"]),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  category: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  payment_method: z.string().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  is_paid: z.boolean().default(true),
  notes: z.string().optional().or(z.literal("")),
  fornecedor: z.string().optional().or(z.literal("")),
  data_vencimento: z.string().optional().or(z.literal("")),
})

type FormValues = z.infer<typeof formSchema>

export function FinancialEntryForm({ initialType, initialCategory }: { initialType?: string; initialCategory?: string }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting }, control } = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      entry_type: (initialType as any) || "RECEITA",
      amount: 0,
      category: initialCategory || "",
      description: "",
      payment_method: "",
      due_date: "",
      is_paid: true,
      notes: "",
      fornecedor: "",
      data_vencimento: "",
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      setFeedback(null)
      await createFinancialEntry(data)
      setFeedback({ type: "success", message: "Lançamento criado com sucesso!" })
      setTimeout(() => router.push("/admin/financeiro"), 600)
    } catch (error: any) {
      setFeedback({ type: "error", message: error.message || "Erro ao criar lançamento." })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {feedback && (
        <div className={`rounded-lg border p-3 text-sm font-medium ${
          feedback.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[#102016]">Tipo *</label>
          <Controller name="entry_type" control={control} render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RECEITA">Receita</SelectItem>
                <SelectItem value="DESPESA">Despesa</SelectItem>
                <SelectItem value="CUSTO">Custo</SelectItem>
              </SelectContent>
            </Select>
          )} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[#102016]">Valor (R$) *</label>
          <Input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} />
          {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-[#102016]">Descrição</label>
        <Input {...register("description")} placeholder="Descrição do lançamento" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[#102016]">Categoria</label>
          <Controller name="category" control={control} render={({ field }) => (
            <select value={field.value} onChange={e => field.onChange(e.target.value)} className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm">
              <option value="">Selecione...</option>
              <option value="Aluguel">Aluguel</option>
              <option value="Combustível">Combustível</option>
              <option value="Fornecedor">Fornecedor</option>
              <option value="Energia">Energia</option>
              <option value="Água">Água</option>
              <option value="Internet">Internet</option>
              <option value="Funcionário">Funcionário</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Marketing">Marketing</option>
              <option value="Seguros">Seguros</option>
              <option value="Impostos">Impostos</option>
              <option value="Telefone">Telefone</option>
              <option value="Transporte">Transporte</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Material de Escritório">Material de Escritório</option>
              <option value="Pró-Labore">Pró-Labore</option>
              <option value="Outras Despesas">Outras Despesas</option>
            </select>
          )} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[#102016]">Forma de Pagamento</label>
          <select {...register("payment_method")} className="w-full h-10 rounded-md border border-[#dfe7dd] px-3 text-sm">
            <option value="">Selecione...</option>
            <option value="Pix">Pix</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão de Crédito">Cartão de Crédito</option>
            <option value="Cartão de Débito">Cartão de Débito</option>
            <option value="Boleto">Boleto</option>
            <option value="Transferência">Transferência</option>
            <option value="Cheque">Cheque</option>
            <option value="Depósito">Depósito</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[#102016]">Fornecedor</label>
          <Input {...register("fornecedor")} placeholder="Nome do fornecedor" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-[#102016]">Data de Vencimento</label>
          <Input type="date" {...register("due_date")} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-[#102016]">Data de Pagamento</label>
          <Input type="date" {...register("data_vencimento")} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-gray-50">
            <Controller name="is_paid" control={control} render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )} />
            <span className="text-sm font-medium">Pago</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-[#102016]">Observações</label>
        <Textarea {...register("notes")} rows={2} placeholder="Observações adicionais..." />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting} className="bg-[#006B2E] text-white hover:bg-[#005324]">
          {isSubmitting ? "Salvando..." : "Criar Lançamento"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/financeiro")}>Cancelar</Button>
      </div>
    </form>
  )
}
