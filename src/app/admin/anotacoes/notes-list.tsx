"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  X,
  Calendar,
  Bell,
  AlertTriangle,
} from "lucide-react"
import {
  updateNote,
  deleteNote,
  toggleConcluida,
} from "./actions"

interface Note {
  id: string
  titulo: string
  descricao: string
  categoria: string
  prioridade: string
  status: string
  data_limite: string | null
  lembrete: string | null
  concluida: boolean
  cor: string
  created_at: string
  updated_at: string
}

const CATEGORIA_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  geral: { label: "Geral", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  tarefa: { label: "Tarefa", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  ideia: { label: "Ideia", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  reuniao: { label: "Reunião", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  projeto: { label: "Projeto", bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  outro: { label: "Outro", bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
}

const PRIORIDADE_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  baixa: { label: "Baixa", dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
  normal: { label: "Normal", dot: "bg-gray-400", bg: "bg-gray-50", text: "text-gray-600" },
  alta: { label: "Alta", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
  urgente: { label: "Urgente", dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  pendente: { label: "Pendente", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  em_andamento: { label: "Em andamento", bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  concluida: { label: "Concluída", bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  cancelada: { label: "Cancelada", bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
}

const CATEGORIAS = ["geral", "tarefa", "ideia", "reuniao", "projeto", "outro"] as const
const PRIORIDADES = ["baixa", "normal", "alta", "urgente"] as const
const STATUS_LIST = ["pendente", "em_andamento", "concluida", "cancelada"] as const

const COR_PRESETS = [
  "", "#006B2E", "#2563eb", "#7c3aed", "#db2777",
  "#ea580c", "#ca8a04", "#059669", "#0891b2", "#dc2626",
]

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatDateTime(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isExpired(d: string | null) {
  if (!d) return false
  return new Date(d) < new Date()
}

function isLembreteVencido(d: string | null) {
  if (!d) return false
  return new Date(d) < new Date()
}

export function NotesList({ initialNotes }: { initialNotes: Note[] }) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    titulo: "",
    descricao: "",
    categoria: "geral" as string,
    prioridade: "normal" as string,
    status: "pendente" as string,
    data_limite: "",
    lembrete: "",
    concluida: false,
    cor: "",
  })

  const handleToggleConcluida = useCallback(async (id: string) => {
    await toggleConcluida(id)
    setNotes(prev =>
      prev.map(n => (n.id === id ? { ...n, concluida: !n.concluida } : n))
    )
  }, [])

  const handleDelete = useCallback(async () => {
    if (!deletingId) return
    await deleteNote(deletingId)
    setNotes(prev => prev.filter(n => n.id !== deletingId))
    setDeletingId(null)
  }, [deletingId])

  const startEdit = useCallback((note: Note) => {
    setEditingNote(note)
    setEditForm({
      titulo: note.titulo,
      descricao: note.descricao,
      categoria: note.categoria || "geral",
      prioridade: note.prioridade || "normal",
      status: note.status || "pendente",
      data_limite: note.data_limite
        ? new Date(note.data_limite).toISOString().slice(0, 10)
        : "",
      lembrete: note.lembrete
        ? new Date(note.lembrete).toISOString().slice(0, 16)
        : "",
      concluida: note.concluida,
      cor: note.cor || "",
    })
  }, [])

  const handleSaveEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote) return
    const fd = new FormData()
    fd.set("titulo", editForm.titulo)
    fd.set("descricao", editForm.descricao)
    fd.set("categoria", editForm.categoria)
    fd.set("prioridade", editForm.prioridade)
    fd.set("status", editForm.status)
    fd.set("data_limite", editForm.data_limite || "")
    fd.set("lembrete", editForm.lembrete || "")
    fd.set("concluida", String(editForm.concluida))
    fd.set("cor", editForm.cor)
    const updated = await updateNote(editingNote.id, fd)
    setNotes(prev => prev.map(n => (n.id === editingNote.id ? updated : n)))
    setEditingNote(null)
  }, [editingNote, editForm])

  return (
    <>
      {notes.length === 0 ? (
        <div className="text-center py-16 text-[#8c9c91]">
          <p className="font-semibold text-lg">Nenhuma anotação encontrada</p>
          <p className="text-sm mt-1">Crie uma nova anotação para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map(note => {
            const catCfg = CATEGORIA_CONFIG[note.categoria] || CATEGORIA_CONFIG.geral
            const priCfg = PRIORIDADE_CONFIG[note.prioridade] || PRIORIDADE_CONFIG.normal
            const stsCfg = STATUS_CONFIG[note.status] || STATUS_CONFIG.pendente
            const expired = !note.concluida && note.data_limite && isExpired(note.data_limite)
            const reminderDue = note.lembrete && isLembreteVencido(note.lembrete)

            return (
              <div
                key={note.id}
                className={`group relative rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                  note.concluida
                    ? "border-[#dfe7dd] opacity-70"
                    : expired
                    ? "border-red-300"
                    : "border-[#dfe7dd]"
                }`}
                style={
                  note.cor
                    ? { borderLeft: `4px solid ${note.cor}` }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleConcluida(note.id)}
                      className="mt-0.5 shrink-0"
                      title={note.concluida ? "Reabrir" : "Concluir"}
                    >
                      {note.concluida ? (
                        <CheckCircle2 className="h-5 w-5 text-[#006B2E]" />
                      ) : (
                        <Circle className="h-5 w-5 text-[#8c9c91] hover:text-[#006B2E] transition-colors" />
                      )}
                    </button>
                    <h3
                      className={`text-sm font-bold leading-snug break-words ${
                        note.concluida ? "text-[#8c9c91] line-through" : "text-[#102016]"
                      }`}
                    >
                      {note.titulo || "Sem título"}
                    </h3>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(note)}
                      className="p-1.5 rounded-lg hover:bg-[#f0f4f0] transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5 text-[#526157]" />
                    </button>
                    <button
                      onClick={() => setDeletingId(note.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>

                {note.descricao && (
                  <p
                    className={`mt-2 text-xs leading-relaxed whitespace-pre-wrap line-clamp-3 ${
                      note.concluida ? "text-[#8c9c91]" : "text-[#526157]"
                    }`}
                  >
                    {note.descricao}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${catCfg.bg} ${catCfg.text} ${catCfg.border}`}
                  >
                    {catCfg.label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${priCfg.bg} ${priCfg.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${priCfg.dot}`} />
                    {priCfg.label}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stsCfg.bg} ${stsCfg.text} ${stsCfg.border}`}
                  >
                    {stsCfg.label}
                  </span>
                  {expired && (
                    <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">
                      <AlertTriangle className="h-3 w-3" />
                      Vencido
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#8c9c91]">
                  {note.data_limite && (
                    <span className={`inline-flex items-center gap-1 ${expired && !note.concluida ? "text-red-600 font-semibold" : ""}`}>
                      <Calendar className="h-3 w-3" />
                      {formatDate(note.data_limite)}
                    </span>
                  )}
                  {note.lembrete && (
                    <span className={`inline-flex items-center gap-1 ${reminderDue && !note.concluida ? "text-amber-600 font-semibold" : ""}`}>
                      <Bell className="h-3 w-3" />
                      {formatDateTime(note.lembrete)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingNote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setEditingNote(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#102016]">Editar Anotação</h2>
              <button
                onClick={() => setEditingNote(null)}
                className="p-1.5 rounded-lg border hover:bg-red-50 text-gray-400 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#102016]">Título</label>
                <input
                  value={editForm.titulo}
                  onChange={e => setEditForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Título da anotação"
                  className="w-full h-9 px-3 rounded-lg border border-[#dfe7dd] text-sm outline-none focus-visible:border-[#006B2E] transition-colors"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#102016]">Descrição</label>
                <textarea
                  value={editForm.descricao}
                  onChange={e => setEditForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Digite sua anotação..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-[#dfe7dd] text-sm outline-none focus-visible:border-[#006B2E] transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#102016]">Categoria</label>
                  <select
                    value={editForm.categoria}
                    onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-[#dfe7dd] text-sm bg-white outline-none focus-visible:border-[#006B2E]"
                  >
                    {CATEGORIAS.map(c => (
                      <option key={c} value={c}>{CATEGORIA_CONFIG[c]?.label || c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#102016]">Prioridade</label>
                  <select
                    value={editForm.prioridade}
                    onChange={e => setEditForm(f => ({ ...f, prioridade: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-[#dfe7dd] text-sm bg-white outline-none focus-visible:border-[#006B2E]"
                  >
                    {PRIORIDADES.map(p => (
                      <option key={p} value={p}>{PRIORIDADE_CONFIG[p]?.label || p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#102016]">Status</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-[#dfe7dd] text-sm bg-white outline-none focus-visible:border-[#006B2E]"
                >
                  {STATUS_LIST.map(s => (
                    <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#102016]">Data limite</label>
                  <input
                    type="date"
                    value={editForm.data_limite}
                    onChange={e => setEditForm(f => ({ ...f, data_limite: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-[#dfe7dd] text-sm outline-none focus-visible:border-[#006B2E] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#102016]">Lembrete</label>
                  <input
                    type="datetime-local"
                    value={editForm.lembrete}
                    onChange={e => setEditForm(f => ({ ...f, lembrete: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-[#dfe7dd] text-sm outline-none focus-visible:border-[#006B2E] transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#102016]">Cor do card</label>
                <div className="flex flex-wrap items-center gap-2">
                  {COR_PRESETS.map(color => (
                    <button
                      key={color || "none"}
                      type="button"
                      onClick={() => setEditForm(f => ({ ...f, cor: color }))}
                      className={`h-7 w-7 rounded-lg border-2 transition-all ${
                        editForm.cor === color
                          ? "border-[#006B2E] scale-110"
                          : "border-[#dfe7dd] hover:border-[#8c9c91]"
                      }`}
                      style={{
                        backgroundColor: color || "#fff",
                        ...(color ? {} : {
                          backgroundImage:
                            "linear-gradient(45deg, #ddd 25%, transparent 25%), linear-gradient(-45deg, #ddd 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ddd 75%), linear-gradient(-45deg, transparent 75%, #ddd 75%)",
                          backgroundSize: "8px 8px",
                          backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0",
                        }),
                      }}
                      title={color || "Sem cor"}
                    />
                  ))}
                  <input
                    type="color"
                    value={editForm.cor || "#006B2E"}
                    onChange={e => setEditForm(f => ({ ...f, cor: e.target.value }))}
                    className="h-7 w-10 rounded-lg border border-[#dfe7dd] cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="h-10 px-4 rounded-lg border border-[#dfe7dd] text-sm text-[#526157] hover:bg-[#fcfdfa]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-lg bg-[#006B2E] text-white text-sm font-bold hover:bg-[#005324]"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDeletingId(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-6 space-y-4 mx-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-black text-[#102016]">Excluir anotação?</h2>
            <p className="text-sm text-[#526157]">
              Esta ação não pode ser desfeita. A anotação será永久mente removida.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="h-10 px-4 rounded-lg border border-[#dfe7dd] text-sm text-[#526157] hover:bg-[#fcfdfa]"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="h-10 px-5 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
