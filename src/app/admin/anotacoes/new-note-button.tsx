"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { createNote } from "./actions"

const CATEGORIAS = ["geral", "tarefa", "ideia", "reuniao", "projeto", "outro"] as const
const PRIORIDADES = ["baixa", "normal", "alta", "urgente"] as const
const STATUS_LIST = ["pendente", "em_andamento", "concluida", "cancelada"] as const

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

const COR_PRESETS = [
  "", "#006B2E", "#2563eb", "#7c3aed", "#db2777",
  "#ea580c", "#ca8a04", "#059669", "#0891b2", "#dc2626",
]

export function NewNoteButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    categoria: "geral",
    prioridade: "normal",
    status: "pendente",
    data_limite: "",
    lembrete: "",
    cor: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.set("titulo", form.titulo)
    fd.set("descricao", form.descricao)
    fd.set("categoria", form.categoria)
    fd.set("prioridade", form.prioridade)
    fd.set("status", form.status)
    fd.set("data_limite", form.data_limite || "")
    fd.set("lembrete", form.lembrete || "")
    fd.set("concluida", "false")
    fd.set("cor", form.cor || "")
    await createNote(fd)
    setForm({
      titulo: "",
      descricao: "",
      categoria: "geral",
      prioridade: "normal",
      status: "pendente",
      data_limite: "",
      lembrete: "",
      cor: "",
    })
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#006B2E] text-white text-sm font-bold hover:bg-[#005324] shadow-sm transition-all"
      >
        <Plus className="h-4 w-4" />
        Nova Anotação
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto mx-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#102016]">Nova Anotação</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg border hover:bg-red-50 text-gray-400 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#102016]">Título</label>
                <input
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  placeholder="Título da anotação"
                  className="w-full h-9 px-3 rounded-lg border border-[#dfe7dd] text-sm outline-none focus-visible:border-[#006B2E] transition-colors"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#102016]">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Digite sua anotação..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-[#dfe7dd] text-sm outline-none focus-visible:border-[#006B2E] transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#102016]">Categoria</label>
                  <select
                    value={form.categoria}
                    onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-[#dfe7dd] text-sm bg-white outline-none focus-visible:border-[#006B2E]"
                  >
                    {CATEGORIAS.map(c => (
                      <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#102016]">Prioridade</label>
                  <select
                    value={form.prioridade}
                    onChange={e => setForm(f => ({ ...f, prioridade: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-[#dfe7dd] text-sm bg-white outline-none focus-visible:border-[#006B2E]"
                  >
                    {PRIORIDADES.map(p => (
                      <option key={p} value={p}>{PRIORIDADE_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-[#102016]">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full h-9 px-3 rounded-lg border border-[#dfe7dd] text-sm bg-white outline-none focus-visible:border-[#006B2E]"
                >
                  {STATUS_LIST.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#102016]">Data limite</label>
                  <input
                    type="date"
                    value={form.data_limite}
                    onChange={e => setForm(f => ({ ...f, data_limite: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-[#dfe7dd] text-sm outline-none focus-visible:border-[#006B2E] transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-[#102016]">Lembrete</label>
                  <input
                    type="datetime-local"
                    value={form.lembrete}
                    onChange={e => setForm(f => ({ ...f, lembrete: e.target.value }))}
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
                      onClick={() => setForm(f => ({ ...f, cor: color }))}
                      className={`h-7 w-7 rounded-lg border-2 transition-all ${
                        form.cor === color
                          ? "border-[#006B2E] scale-110"
                          : "border-[#dfe7dd] hover:border-[#8c9c91]"
                      }`}
                      style={{
                        backgroundColor: color || "#fff",
                        ...(color
                          ? {}
                          : {
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
                    value={form.cor || "#006B2E"}
                    onChange={e => setForm(f => ({ ...f, cor: e.target.value }))}
                    className="h-7 w-10 rounded-lg border border-[#dfe7dd] cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
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
    </>
  )
}
