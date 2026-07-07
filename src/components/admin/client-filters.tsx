"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCallback, useState, useTransition } from "react"
import { Search } from "lucide-react"

interface Props {
  initialSearch?: string
  initialSort?: string
  initialAtivo?: string
  initialFilter?: string
}

export function ClientFilters({ initialSearch = "", initialSort = "created_at_desc", initialAtivo = "", initialFilter = "" }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(initialSearch)

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) { params.set(key, value) } else { params.delete(key) }
      }
      params.set("page", "1")
      startTransition(() => { router.push(`/admin/clientes?${params.toString()}`) })
    },
    [router, searchParams, startTransition],
  )

  return (
    <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9c91]" />
          <Input
            placeholder="Nome, telefone, CPF, cidade..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); updateParams({ search: e.target.value }) }}
            className="pl-9"
            disabled={isPending}
          />
        </div>

        <Select value={initialFilter || "all"} onValueChange={(v) => updateParams({ filter: v === "all" ? "" : v ?? "" })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtro" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="recentes">Clientes recentes</SelectItem>
            <SelectItem value="com_pedidos">Com pedidos</SelectItem>
            <SelectItem value="sem_pedidos">Sem pedidos</SelectItem>
            <SelectItem value="mais_compras">Mais compras</SelectItem>
            <SelectItem value="maior_faturamento">Maior faturamento</SelectItem>
          </SelectContent>
        </Select>

        <Select value={initialAtivo || "all"} onValueChange={(v) => updateParams({ ativo: v === "all" ? "" : v ?? "" })}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Ativos</SelectItem>
            <SelectItem value="false">Inativos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={initialSort} onValueChange={(v) => updateParams({ sort: v ?? "created_at_desc" })}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at_desc">Data de cadastro</SelectItem>
            <SelectItem value="name_asc">Nome A-Z</SelectItem>
            <SelectItem value="name_desc">Nome Z-A</SelectItem>
            <SelectItem value="last_purchase_date_desc">Última compra</SelectItem>
            <SelectItem value="total_spent_desc">Total gasto</SelectItem>
            <SelectItem value="purchase_count_desc">Qtd. de pedidos</SelectItem>
          </SelectContent>
        </Select>

        {isPending && <span className="text-sm text-[#8c9c91] animate-pulse">Buscando...</span>}
      </div>
    </div>
  )
}
