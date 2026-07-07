import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeftRight, Receipt, Calendar, Wallet, BarChart3, AlertTriangle, Clock, Info } from "lucide-react"
import { RealtimeRefresh } from "@/components/admin/realtime-refresh"
import { ContasReceberInline } from "./contas-receber-inline"
import { LancamentosTab } from "./lancamentos-tab"
import { RecorrentesTab } from "./recorrentes-tab"
import { FluxoCaixaTab } from "./fluxo-caixa-tab"
import { CalendarioTab } from "./calendario-tab"
import { getAlerts } from "./actions"

export const dynamic = "force-dynamic"

interface SearchParams { page?: string; entryType?: string; isPaid?: string; tab?: string }

const TABS = [
  { key: "lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { key: "recorrentes", label: "Recorrentes", icon: Wallet },
  { key: "contas-receber", label: "Contas a Receber", icon: Receipt },
  { key: "fluxo-caixa", label: "Fluxo de Caixa", icon: BarChart3 },
  { key: "calendario", label: "Calendário", icon: Calendar },
]

const ALERT_STYLES: Record<string, { bg: string; border: string; text: string; icon: any; label: string }> = {
  vencida: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: AlertTriangle, label: "Vencida" },
  "vence-hoje": { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: Clock, label: "Vence Hoje" },
  "vence-3dias": { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: Clock, label: "Vence em 3 dias" },
  "recorrente-gerada": { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: Info, label: "Recorrente" },
}

export default async function FinanceiroPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = await searchParams
  const tab = params?.tab || "lancamentos"
  let alerts: any[] = []
  try { alerts = await getAlerts() } catch {}

  return (
    <section className="space-y-6 p-6">
      <RealtimeRefresh tables={["financial_entries", "orders", "contas_receber", "recurring_expenses"]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Financeiro</h1>
          <p className="text-sm text-[#526157]">Controle completo de receitas, despesas e fluxo de caixa</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/financeiro/novo?type=DESPESA">
            <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50"><Receipt className="h-4 w-4 mr-2" />Nova Despesa</Button>
          </Link>
          <Link href="/admin/financeiro/novo">
            <Button className="bg-[#006B2E] text-white hover:bg-[#005324]"><Plus className="h-4 w-4 mr-2" />Nova Entrada</Button>
          </Link>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((alert: any) => {
            const style = ALERT_STYLES[alert.type] || ALERT_STYLES["vence-hoje"]
            const Icon = style.icon
            return (
              <div
                key={alert.id}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium ${style.bg} ${style.border} ${style.text}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{alert.message}</span>
                <Badge className="ml-1 bg-white/80 text-inherit border-inherit">{alert.count}</Badge>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex gap-1 rounded-xl border border-[#dfe7dd] bg-[#fcfdfa] p-1 shadow-sm overflow-x-auto">
        {TABS.map(t => {
          const Icon = t.icon
          const isActive = tab === t.key
          return (
            <Link
              key={t.key}
              href={`/admin/financeiro?tab=${t.key}`}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${
                isActive
                  ? "bg-white text-[#006B2E] shadow-sm border border-[#dfe7dd]"
                  : "text-[#526157] hover:text-[#102016] hover:bg-white/50"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t.label}
            </Link>
          )
        })}
      </div>

      {tab === "lancamentos" && <LancamentosTab />}
      {tab === "recorrentes" && <RecorrentesTab />}
      {tab === "contas-receber" && <ContasReceberInline />}
      {tab === "fluxo-caixa" && <FluxoCaixaTab />}
      {tab === "calendario" && <CalendarioTab />}
    </section>
  )
}
