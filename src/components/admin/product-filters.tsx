"use client"

import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  initialSearch?: string
  initialCategory?: string
  initialActive?: string
  initialSort?: string
  categories?: { id: string; name: string }[]
}

export default function ProductFilters({ initialSearch = "", initialCategory = "", initialActive = "", initialSort = "created_at_desc", categories = [] }: Props) {
  return (
    <form method="GET" className="flex flex-wrap gap-3 items-end rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm">
      <div className="flex-1 min-w-[200px]">
        <label className="text-xs font-semibold text-[#526157] mb-1 block">Buscar</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9c91]" />
          <input name="search" defaultValue={initialSearch} placeholder="Nome, código..." className="w-full pl-9 h-9 rounded-md border border-[#dfe7dd] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#006B2E]" />
        </div>
      </div>
      {categories.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-[#526157] mb-1 block">Categoria</label>
          <select name="category" defaultValue={initialCategory} className="h-9 rounded-md border border-[#dfe7dd] px-3 text-sm">
            <option value="">Todas</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="text-xs font-semibold text-[#526157] mb-1 block">Status</label>
        <select name="active" defaultValue={initialActive} className="h-9 rounded-md border border-[#dfe7dd] px-3 text-sm">
          <option value="">Todos</option>
          <option value="true">Ativos</option>
          <option value="false">Inativos</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#526157] mb-1 block">Ordenar</label>
        <select name="sort" defaultValue={initialSort} className="h-9 rounded-md border border-[#dfe7dd] px-3 text-sm">
          <option value="created_at_desc">Mais recentes</option>
          <option value="name_asc">Nome A-Z</option>
          <option value="name_desc">Nome Z-A</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
        </select>
      </div>
      <Button type="submit" variant="outline" className="h-9">Filtrar</Button>
    </form>
  )
}
