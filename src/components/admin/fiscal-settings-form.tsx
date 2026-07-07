"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateNfeConfig } from "@/app/admin/configuracoes/fiscais/actions"

interface Props {
  initialData: Record<string, any>
}

export function FiscalSettingsForm({ initialData }: Props) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    razao_social: initialData.razao_social || "",
    nome_fantasia: initialData.nome_fantasia || "",
    cnpj: initialData.cnpj || "",
    ie: initialData.ie || "",
    im: initialData.im || "",
    endereco: initialData.endereco || "",
    numero: initialData.numero || "",
    complemento: initialData.complemento || "",
    bairro: initialData.bairro || "",
    cidade: initialData.cidade || "",
    estado: initialData.estado || "",
    cep: initialData.cep || "",
    telefone: initialData.telefone || "",
    email: initialData.email || "",
    regime_tributario: initialData.regime_tributario || "simples_nacional",
    provider: initialData.provider || "nuvem_fiscal",
    environment: initialData.environment || "homologacao",
    serie_nfe: initialData.serie_nfe || 1,
    serie_nfce: initialData.serie_nfce || 1,
    observacoes_padrao: initialData.observacoes_padrao || "",
    logo_url: initialData.logo_url || "",
  })

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    try {
      await updateNfeConfig(form)
      setFeedback({ type: "success", message: "Configurações fiscais salvas com sucesso!" })
      router.refresh()
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Erro ao salvar." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {feedback && (
        <div className={`rounded-lg border p-3 text-sm font-medium ${
          feedback.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>{feedback.message}</div>
      )}

      {/* Dados da Empresa */}
      <fieldset className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <legend className="text-base font-bold text-[#102016] px-2">Dados da Empresa</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Razão Social</label>
            <Input value={form.razao_social} onChange={e => update("razao_social", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nome Fantasia</label>
            <Input value={form.nome_fantasia} onChange={e => update("nome_fantasia", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CNPJ</label>
            <Input value={form.cnpj} onChange={e => update("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Inscrição Estadual</label>
            <Input value={form.ie} onChange={e => update("ie", e.target.value)} placeholder="000.000.000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Inscrição Municipal</label>
            <Input value={form.im} onChange={e => update("im", e.target.value)} placeholder="000.000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Regime Tributário</label>
            <select value={form.regime_tributario} onChange={e => update("regime_tributario", e.target.value)} className="w-full h-9 rounded-md border border-[#dfe7dd] px-3 text-sm">
              <option value="simples_nacional">Simples Nacional</option>
              <option value="lucro_presumido">Lucro Presumido</option>
              <option value="lucro_real">Lucro Real</option>
              <option value="mei">MEI</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* Endereço */}
      <fieldset className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <legend className="text-base font-bold text-[#102016] px-2">Endereço</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Endereço</label>
            <Input value={form.endereco} onChange={e => update("endereco", e.target.value)} placeholder="Rua, avenida..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Número</label>
            <Input value={form.numero} onChange={e => update("numero", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Complemento</label>
            <Input value={form.complemento} onChange={e => update("complemento", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bairro</label>
            <Input value={form.bairro} onChange={e => update("bairro", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cidade</label>
            <Input value={form.cidade} onChange={e => update("cidade", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <Input value={form.estado} onChange={e => update("estado", e.target.value)} placeholder="BA" maxLength={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CEP</label>
            <Input value={form.cep} onChange={e => update("cep", e.target.value)} placeholder="00000-000" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <Input value={form.telefone} onChange={e => update("telefone", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-mail</label>
            <Input value={form.email} onChange={e => update("email", e.target.value)} type="email" />
          </div>
        </div>
      </fieldset>

      {/* Configuração NF-e */}
      <fieldset className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <legend className="text-base font-bold text-[#102016] px-2">Nota Fiscal Eletrônica</legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Provedor</label>
            <select value={form.provider} onChange={e => update("provider", e.target.value)} className="w-full h-9 rounded-md border border-[#dfe7dd] px-3 text-sm">
              <option value="nuvem_fiscal">Nuvem Fiscal</option>
              <option value="enotas">eNotas</option>
              <option value="tecnospeed">Tecnospeed</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ambiente</label>
            <select value={form.environment} onChange={e => update("environment", e.target.value)} className="w-full h-9 rounded-md border border-[#dfe7dd] px-3 text-sm">
              <option value="homologacao">Homologação</option>
              <option value="producao">Produção</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Série NF-e</label>
            <Input type="number" value={form.serie_nfe} onChange={e => update("serie_nfe", Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Série NFC-e</label>
            <Input type="number" value={form.serie_nfce} onChange={e => update("serie_nfce", Number(e.target.value))} />
          </div>
        </div>
      </fieldset>

      {/* Observações Padrão */}
      <fieldset className="rounded-xl border border-[#dfe7dd] bg-white p-5 shadow-sm space-y-4">
        <legend className="text-base font-bold text-[#102016] px-2">Observações da Nota</legend>
        <div>
          <label className="block text-sm font-medium mb-1">Observações Padrão</label>
          <Textarea value={form.observacoes_padrao} onChange={e => update("observacoes_padrao", e.target.value)} rows={3} placeholder="Informações complementares que aparecerão em todas as notas..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">URL da Logo (para nota fiscal)</label>
          <Input value={form.logo_url} onChange={e => update("logo_url", e.target.value)} placeholder="https://exemplo.com/logo-nfe.png" />
        </div>
      </fieldset>

      <Button type="submit" disabled={saving} className="bg-[#006B2E] text-white hover:bg-[#005324]">
        {saving ? "Salvando..." : "Salvar Configurações Fiscais"}
      </Button>
    </form>
  )
}
