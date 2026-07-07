"use client"

import { Controller } from "react-hook-form"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateStoreSettings } from "@/app/admin/configuracoes/actions"
import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { useAdminForm } from "@/lib/use-admin-form"

const settingsSchema = z.object({
  company_name: z.string().min(1),
  whatsapp_phone: z.string().min(1),
  support_email: z.string(),
  address_line: z.string(),
  city_state: z.string(),
  hero_title: z.string(),
  hero_subtitle: z.string(),
  institutional_text: z.string(),
  logo_url: z.string(),
  hero_image_url: z.string().optional().or(z.literal("")),
  facebook: z.string().optional().or(z.literal("")),
  instagram: z.string().optional().or(z.literal("")),
  youtube: z.string().optional().or(z.literal("")),
  tiktok: z.string().optional().or(z.literal("")),
  cnpj: z.string().optional().or(z.literal("")),
  ie: z.string().optional().or(z.literal("")),
  company_phone: z.string().optional().or(z.literal("")),
  fiscal_email: z.string().optional().or(z.literal("")),
  show_prices: z.boolean(),
  show_stock: z.boolean(),
  show_availability: z.boolean(),
  whatsapp_message_template: z.string().optional().or(z.literal("")),
  emitir_nota_automaticamente: z.boolean(),
  printer_type: z.enum(["a4", "thermal_58mm", "thermal_80mm"]),
  auto_print_order: z.boolean(),
  print_show_logo: z.boolean(),
  print_show_notes: z.boolean(),
  print_show_phone: z.boolean(),
  print_show_address: z.boolean(),
})

type SettingsValues = z.infer<typeof settingsSchema>

interface Props {
  initialData: SettingsValues
}

const DEFAULTS: SettingsValues = {
  company_name: "", whatsapp_phone: "", support_email: "",
  address_line: "", city_state: "", hero_title: "",
  hero_subtitle: "", institutional_text: "", logo_url: "",
  hero_image_url: "", facebook: "", instagram: "",
  youtube: "", tiktok: "", cnpj: "", ie: "",
  company_phone: "", fiscal_email: "",
  show_prices: true, show_stock: true, show_availability: true,
  whatsapp_message_template: "",
  emitir_nota_automaticamente: false,
  printer_type: "a4",
  auto_print_order: false,
  print_show_logo: true, print_show_notes: true,
  print_show_phone: true, print_show_address: true,
}

export function SettingsForm({ initialData }: Props) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const { register, control, errors, isSubmitting, submit } = useAdminForm({
    schema: settingsSchema,
    defaultValues: DEFAULTS,
    initialData,
    onUpdate: async (id, data) => {
      try {
        setFeedback(null)
        await updateStoreSettings(data)
        setFeedback({ type: "success", message: "Configurações salvas com sucesso!" })
        router.refresh()
      } catch (error: any) {
        setFeedback({ type: "error", message: error.message || "Erro ao salvar configurações." })
      }
    },
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-8">
      {feedback && (
        <div className={`rounded-lg border p-3 text-sm font-medium ${
          feedback.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>{feedback.message}</div>
      )}

      {/* Company */}
      <fieldset className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <legend className="text-base font-bold text-[#102016] px-2">Empresa</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome da Empresa</label>
            <Input {...register("company_name")} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone Comercial</label>
            <Input {...register("company_phone")} placeholder="(xx) xxxx-xxxx" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CNPJ</label>
            <Input {...register("cnpj")} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Inscrição Estadual</label>
            <Input {...register("ie")} placeholder="000.000.000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-mail Fiscal</label>
            <Input {...register("fiscal_email")} type="email" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-mail de Suporte</label>
            <Input {...register("support_email")} type="email" />
          </div>
        </div>
      </fieldset>

      {/* WhatsApp / Address */}
      <fieldset className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <legend className="text-base font-bold text-[#102016] px-2">Contato e Endereço</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp</label>
            <Input {...register("whatsapp_phone")} placeholder="5574999581805" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cidade/Estado</label>
            <Input {...register("city_state")} placeholder="Pindobaçu - Bahia" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Endereço</label>
            <Input {...register("address_line")} placeholder="Rua, número, bairro" />
          </div>
        </div>
      </fieldset>

      {/* Hero */}
      <fieldset className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <legend className="text-base font-bold text-[#102016] px-2">Hero (Site Público)</legend>
        <div>
          <label className="block text-sm font-medium mb-1">Imagem/Banner do Garoto-Propaganda</label>
          <Input {...register("hero_image_url")} placeholder="https://exemplo.com/banner.jpg" />
          <p className="text-xs text-[#8c9c91] mt-1">URL da imagem que substituirá o texto principal. Deixe vazio para usar o texto padrão.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Título (usado se não houver imagem)</label>
          <Input {...register("hero_title")} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subtítulo (usado se não houver imagem)</label>
          <Input {...register("hero_subtitle")} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">URL da Logo</label>
          <Input {...register("logo_url")} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Texto Institucional</label>
          <Textarea {...register("institutional_text")} rows={3} />
        </div>
      </fieldset>

      {/* Social Media */}
      <fieldset className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <legend className="text-base font-bold text-[#102016] px-2">Redes Sociais</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Facebook</label>
            <Input {...register("facebook")} placeholder="URL do Facebook" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instagram</label>
            <Input {...register("instagram")} placeholder="URL do Instagram" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">YouTube</label>
            <Input {...register("youtube")} placeholder="URL do YouTube" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">TikTok</label>
            <Input {...register("tiktok")} placeholder="URL do TikTok" />
          </div>
        </div>
      </fieldset>

      {/* Visibility Toggles */}
      <fieldset className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <legend className="text-base font-bold text-[#102016] px-2">Visibilidade no Site</legend>
        <div className="space-y-3">
          {[
            { name: "show_prices" as const, label: "Mostrar preços no site", desc: "Quando desativado, nenhum preço aparece no catálogo público." },
            { name: "show_stock" as const, label: "Mostrar estoque no site", desc: "Exibe a quantidade em estoque dos produtos." },
            { name: "show_availability" as const, label: "Mostrar disponibilidade", desc: "Exibe indicador de disponível/indisponível." },
          ].map(({ name, label, desc }) => (
            <label key={name} className="flex items-center gap-3 p-3 rounded-lg border border-[#dfe7dd] cursor-pointer hover:bg-[#fcfdfa]">
              <Controller name={name} control={control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <div>
                <span className="text-sm font-medium">{label}</span>
                <p className="text-xs text-[#8c9c91]">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* NF-e Auto Emit */}
      <fieldset className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <legend className="text-base font-bold text-[#102016] px-2">Nota Fiscal</legend>
        <label className="flex items-center gap-3 p-3 rounded-lg border border-[#dfe7dd] cursor-pointer hover:bg-[#fcfdfa]">
          <Controller name="emitir_nota_automaticamente" control={control} render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )} />
          <div>
            <span className="text-sm font-medium">Emitir NF-e automaticamente</span>
            <p className="text-xs text-[#8c9c91]">Quando ativado, uma nota fiscal será gerada automaticamente ao finalizar um pedido com pagamento confirmado.</p>
          </div>
        </label>
      </fieldset>

      {/* WhatsApp Message */}
      <fieldset className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <legend className="text-base font-bold text-[#102016] px-2">Mensagem WhatsApp</legend>
        <div>
          <label className="block text-sm font-medium mb-1">Template de Mensagem</label>
          <Textarea {...register("whatsapp_message_template")} rows={4} placeholder="Olá, gostaria de solicitar o pedido: {{basket_name}}..." />
          <p className="text-xs text-[#8c9c91] mt-1">Use {'{{basket_name}}'}, {'{{items}}'}, {'{{total}}'}, {'{{protocol}}'}, {'{{client_name}}'}, {'{{client_phone}}'} como variáveis.</p>
        </div>
      </fieldset>

      {/* Print Settings */}
      <fieldset className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <legend className="text-base font-bold text-[#102016] px-2">Impressão</legend>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Impressora</label>
            <select {...register("printer_type")} className="flex h-10 w-full rounded-lg border border-[#dfe7dd] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#006B2E]">
              <option value="a4">A4 (Padrão)</option>
              <option value="thermal_58mm">Térmica 58mm</option>
              <option value="thermal_80mm">Térmica 80mm</option>
            </select>
          </div>
          {[
            { name: "auto_print_order" as const, label: "Impressão automática ao finalizar pedido", desc: "Abre a impressão automaticamente quando um pedido é finalizado." },
            { name: "print_show_logo" as const, label: "Mostrar logo na impressão", desc: "Exibe o logotipo da empresa nos documentos impressos." },
            { name: "print_show_notes" as const, label: "Mostrar observações na impressão", desc: "Exibe as observações do pedido na impressão." },
            { name: "print_show_phone" as const, label: "Mostrar telefone na impressão", desc: "Exibe o telefone do cliente no comprovante." },
            { name: "print_show_address" as const, label: "Mostrar endereço na impressão", desc: "Exibe o endereço do cliente no comprovante." },
          ].map(({ name, label, desc }) => (
            <label key={name} className="flex items-center gap-3 p-3 rounded-lg border border-[#dfe7dd] cursor-pointer hover:bg-[#fcfdfa]">
              <Controller name={name} control={control} render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
              <div>
                <span className="text-sm font-medium">{label}</span>
                <p className="text-xs text-[#8c9c91]">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" disabled={isSubmitting} className="bg-[#006B2E] text-white hover:bg-[#005324]">
        {isSubmitting ? "Salvando..." : "Salvar Configurações"}
      </Button>
    </form>
  )
}
