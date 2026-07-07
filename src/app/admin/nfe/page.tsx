import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Settings, AlertTriangle, Eye, Printer, XCircle, Send } from "lucide-react"
import Link from "next/link"
import { getStoreSettings } from "@/app/admin/configuracoes/actions"
import { RealtimeRefresh } from "@/components/admin/realtime-refresh"
import { emitNfe, cancelNfe } from "./actions"
import { listNfeEmissions, getNfeConfig } from "@/lib/services/nfe"

export const dynamic = "force-dynamic"

function formatDateTime(d: string) { return new Date(d).toLocaleString("pt-BR") }
function formatCurrency(v: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) }

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  AUTHORIZED: { label: "Autorizada", variant: "default" },
  PENDENTE: { label: "Pendente", variant: "secondary" },
  CANCELED: { label: "Cancelada", variant: "destructive" },
  DENIED: { label: "Denegada", variant: "destructive" },
  ERROR: { label: "Erro", variant: "destructive" },
}

export default async function NfePage() {
  const config = await getNfeConfig()
  const settings = await getStoreSettings()
  const invoices = await listNfeEmissions()

  return (
    <section className="space-y-6 p-6">
      <RealtimeRefresh tables={["nfe_emissions", "orders"]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Notas Fiscais</h1>
          <p className="text-sm text-[#526157]">Emissão e gerenciamento de NF-e / NFC-e</p>
        </div>
        <Link href="/admin/configuracoes"><Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-2" />Configurar</Button></Link>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="text-xs font-bold text-green-700 uppercase">Autorizadas</div>
          <div className="text-2xl font-black text-green-800">{(invoices ?? []).filter((i: any) => i.status === "AUTHORIZED").length}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-bold text-amber-700 uppercase">Pendentes</div>
          <div className="text-2xl font-black text-amber-800">{(invoices ?? []).filter((i: any) => i.status === "PENDENTE").length}</div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-xs font-bold text-red-700 uppercase">Canceladas</div>
          <div className="text-2xl font-black text-red-800">{(invoices ?? []).filter((i: any) => i.status === "CANCELED").length}</div>
        </div>
      </div>

      {/* Config Card */}
      <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
        <div className="text-xs font-semibold text-[#526157] uppercase mb-3">Configuração Atual</div>
        {config ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
            <div><span className="text-[#8c9c91]">Ambiente:</span><div className="font-semibold">{config.environment === "producao" ? "Produção" : "Homologação"}</div></div>
            <div><span className="text-[#8c9c91]">Série NF-e:</span><div className="font-semibold">{config.serie_nfe}</div></div>
            <div><span className="text-[#8c9c91]">Série NFC-e:</span><div className="font-semibold">{config.serie_nfce}</div></div>
            <div><span className="text-[#8c9c91]">Último Número:</span><div className="font-semibold">#{Math.max(config.ultimo_numero_nfe, config.ultimo_numero_nfce)}</div></div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[#8c9c91] text-sm"><AlertTriangle className="h-4 w-4 text-amber-500" /> Configure os dados fiscais em Configurações</div>
        )}
      </div>

      {/* Invoice Table */}
      <div className="rounded-xl border border-[#dfe7dd] bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-[#fcfdfa] border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#006B2E]" />
            <h2 className="text-sm font-bold text-[#102016]">Notas Fiscais</h2>
          </div>
          <span className="text-xs text-[#8c9c91]">{invoices?.length || 0} registro(s)</span>
        </div>
        {!invoices || invoices.length === 0 ? (
          <div className="p-8 text-center text-[#8c9c91]">Nenhuma nota fiscal encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#fcfdfa] text-left"><tr>
                <th className="px-4 py-3 font-semibold text-[#526157] whitespace-nowrap">N° Nota</th>
                <th className="px-4 py-3 font-semibold text-[#526157] whitespace-nowrap">Pedido</th>
                <th className="px-4 py-3 font-semibold text-[#526157] whitespace-nowrap">Cliente</th>
                <th className="px-4 py-3 font-semibold text-[#526157] whitespace-nowrap">CPF/CNPJ</th>
                <th className="px-4 py-3 font-semibold text-[#526157] whitespace-nowrap">Valor</th>
                <th className="px-4 py-3 font-semibold text-[#526157] whitespace-nowrap">Data</th>
                <th className="px-4 py-3 font-semibold text-[#526157] whitespace-nowrap">Status</th>
                <th className="px-4 py-3 font-semibold text-[#526157] whitespace-nowrap text-right">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-[#f0f4f0]">
                {invoices.map((inv: any) => {
                  const order = inv.order || {}
                  const customer = Array.isArray(order.customer) ? order.customer[0] : order.customer || {}
                  const st = STATUS_CONFIG[inv.status] || { label: inv.status, variant: "secondary" as const }
                  return (
                    <tr key={inv.id} className="hover:bg-[#fcfdfa]">
                      <td className="px-4 py-3 font-mono font-bold text-[#006B2E]">#{String(inv.number).padStart(6, "0")}</td>
                      <td className="px-4 py-3 font-mono text-xs">{order.protocol || "-"}</td>
                      <td className="px-4 py-3 text-[#102016] max-w-[160px] truncate">{customer?.name || "-"}</td>
                      <td className="px-4 py-3 text-[#526157] font-mono text-xs">{customer?.cpf_cnpj ? (customer.cpf_cnpj.length > 11 ? formatCnpj(customer.cpf_cnpj) : formatCpf(customer.cpf_cnpj)) : "-"}</td>
                      <td className="px-4 py-3 font-mono font-semibold">{formatCurrency(Number(order.total_value) || 0)}</td>
                      <td className="px-4 py-3 text-[#8c9c91] text-xs whitespace-nowrap">{formatDateTime(inv.created_at)}</td>
                      <td className="px-4 py-3"><Badge variant={st.variant}>{st.label}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          {inv.status === "PENDENTE" && (
                            <>
                              <EmitButton invoiceId={inv.id} />
                              <CancelButton invoiceId={inv.id} />
                            </>
                          )}
                          <Link href={`/imprimir/nfe/${inv.id}`} target="_blank">
                            <Button size="sm" variant="outline" title="Visualizar">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/imprimir/nfe/${inv.id}`} target="_blank">
                            <Button size="sm" variant="outline" title="Imprimir">
                              <Printer className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function formatCpf(v: string) { return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") }
function formatCnpj(v: string) { return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") }

function EmitButton({ invoiceId }: { invoiceId: string }) {
  return (
    <form action={async () => { "use server"; await emitNfe(invoiceId) }}>
                              <button type="submit" className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input hover:bg-accent hover:text-green-600" title="Emitir">
        <Send className="h-4 w-4" />
      </button>
    </form>
  )
}

function CancelButton({ invoiceId }: { invoiceId: string }) {
  return (
    <form action={async () => { "use server"; await cancelNfe(invoiceId) }}>
      <button type="submit" className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input hover:bg-accent hover:text-red-600" title="Cancelar">
        <XCircle className="h-4 w-4" />
      </button>
    </form>
  )
}
