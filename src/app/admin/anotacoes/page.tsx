import { Suspense } from "react"
import { listNotes } from "./actions"
import { NotesList } from "./notes-list"
import { NewNoteButton } from "./new-note-button"
import { Button } from "@/components/ui/button"
import { Search, RotateCcw } from "lucide-react"

export const dynamic = "force-dynamic"

const CATEGORIA_LABELS: Record<string, string> = {
  geral: "Geral",
  tarefa: "Tarefa",
  ideia: "Ideia",
  reuniao: "Reunião",
  projeto: "Projeto",
  outro: "Outro",
}

const PRIORIDADE_LABELS: Record<string, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
}

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
}

const SORT_OPTIONS = [
  { value: "updated_at-desc", label: "Mais recentes" },
  { value: "updated_at-asc", label: "Mais antigos" },
  { value: "titulo-asc", label: "Título A-Z" },
  { value: "titulo-desc", label: "Título Z-A" },
  { value: "data_limite-asc", label: "Data limite (próximas)" },
  { value: "prioridade-desc", label: "Prioridade (maior)" },
]

interface SearchParams {
  search?: string
  categoria?: string
  prioridade?: string
  status?: string
  sort?: string
}

export default async function AnotacoesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  const params = await searchParams
  const search = params?.search || ""
  const categoria = params?.categoria || ""
  const prioridade = params?.prioridade || ""
  const status = params?.status || ""
  const sort = params?.sort || "updated_at-desc"
  const [sortBy, sortOrder] = sort.split("-") as [string, "asc" | "desc"]

  const notes = await listNotes({ search, categoria, prioridade, status, sortBy, sortOrder })

  const hasFilters = search || categoria || prioridade || status

  return (
    <section className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102016]">Anotações</h1>
          <p className="text-sm text-[#526157] mt-0.5">
            {notes.length} {notes.length === 1 ? "anotação encontrada" : "anotações encontradas"}
          </p>
        </div>
        <NewNoteButton />
      </div>

      <div className="rounded-xl border border-[#dfe7dd] bg-white p-4 shadow-sm space-y-4">
        <form method="GET" className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8c9c91]" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Pesquisar anotações..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#dfe7dd] bg-white text-sm outline-none focus-visible:border-[#006B2E] transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Categoria</label>
            <select
              name="categoria"
              defaultValue={categoria}
              className="h-9 rounded-lg border border-[#dfe7dd] px-3 text-sm bg-white outline-none focus-visible:border-[#006B2E]"
            >
              <option value="">Todas</option>
              {Object.entries(CATEGORIA_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Prioridade</label>
            <select
              name="prioridade"
              defaultValue={prioridade}
              className="h-9 rounded-lg border border-[#dfe7dd] px-3 text-sm bg-white outline-none focus-visible:border-[#006B2E]"
            >
              <option value="">Todas</option>
              {Object.entries(PRIORIDADE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Status</label>
            <select
              name="status"
              defaultValue={status}
              className="h-9 rounded-lg border border-[#dfe7dd] px-3 text-sm bg-white outline-none focus-visible:border-[#006B2E]"
            >
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#526157] mb-1 block">Ordenar</label>
            <select
              name="sort"
              defaultValue={sort}
              className="h-9 rounded-lg border border-[#dfe7dd] px-3 text-sm bg-white outline-none focus-visible:border-[#006B2E]"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="bg-[#006B2E] text-white hover:bg-[#005324]">
            Filtrar
          </Button>
          {hasFilters && (
            <a
              href="/admin/anotacoes"
              className="inline-flex items-center gap-1 h-9 px-3 text-xs text-[#006B2E] hover:underline"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar
            </a>
          )}
        </form>
      </div>

      <Suspense fallback={<div className="text-center py-12 text-[#8c9c91]">Carregando...</div>}>
        <NotesList initialNotes={notes} />
      </Suspense>
    </section>
  )
}
