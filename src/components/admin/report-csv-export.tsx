"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

interface ReportExportData {
  grouped: Record<string, { revenue: number; profit: number; orders: number; expenses: number }>
  productReport: Array<{ name: string; category: string; quantity: number; revenue: number; profit: number }>
  topCustomers: Array<{ name: string; orders: number; total: number }>
  dailyBilling: Record<string, number>
  startDate: string
  endDate: string
  groupBy: string
}

export function ReportCSVDownload({ data }: { data: ReportExportData }) {
  const handleDownload = () => {
    const lines: string[] = []
    const BOM = "\uFEFF"
    const today = new Date().toISOString().split("T")[0]

    // Evolution
    if (Object.keys(data.grouped).length > 0) {
      lines.push("Evolucao;Periodo;Pedidos;Faturamento;Despesas;Lucro")
      for (const [period, d] of Object.entries(data.grouped)) {
        lines.push(`"${period}";${d.orders};${formatCurrency(d.revenue)};${formatCurrency(d.expenses)};${formatCurrency(d.revenue - d.expenses)}`)
      }
      lines.push("")
    }

    // Top customers
    if (data.topCustomers.length > 0) {
      lines.push("Clientes;Nome;Pedidos;Total Gasto")
      for (const c of data.topCustomers) {
        lines.push(`"${c.name}";${c.orders};${formatCurrency(c.total)}`)
      }
      lines.push("")
    }

    // Products
    if (data.productReport.length > 0) {
      lines.push("Produtos;Produto;Categoria;Qtd;Receita;Lucro")
      for (const p of data.productReport) {
        lines.push(`"${p.name}";"${p.category}";${p.quantity};${formatCurrency(p.revenue)};${formatCurrency(p.profit)}`)
      }
      lines.push("")
    }

    // Daily billing
    if (Object.keys(data.dailyBilling).length > 0) {
      lines.push("Faturamento Diario;Data;Valor")
      for (const [day, value] of Object.entries(data.dailyBilling).sort(([a], [b]) => a.localeCompare(b))) {
        lines.push(`${day};${formatCurrency(value)}`)
      }
    }

    const csvContent = BOM + lines.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `relatorio_${data.groupBy}_${today}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={handleDownload}>
      <Download className="h-4 w-4 mr-2" /> Exportar CSV
    </Button>
  )
}
