"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const sb = () => supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

const CATEGORIAS = ["geral", "tarefa", "ideia", "reuniao", "projeto", "outro"] as const
const PRIORIDADES = ["baixa", "normal", "alta", "urgente"] as const
const STATUS_LIST = ["pendente", "em_andamento", "concluida", "cancelada"] as const

const noteSchema = z.object({
  titulo: z.string().max(300, "Título muito longo").default(""),
  descricao: z.string().default(""),
  categoria: z.enum(CATEGORIAS).default("geral"),
  prioridade: z.enum(PRIORIDADES).default("normal"),
  status: z.enum(STATUS_LIST).default("pendente"),
  data_limite: z.string().nullable().optional(),
  lembrete: z.string().nullable().optional(),
  concluida: z.preprocess(
    v => v === "true" || v === true,
    z.boolean().default(false)
  ),
  cor: z.string().default(""),
})

export type NoteFormData = z.infer<typeof noteSchema>

function mapRow(row: any) {
  return {
    ...row,
    data_limite: row.data_limite ?? null,
    lembrete: row.lembrete ?? null,
  }
}

export async function listNotes(opts: {
  search?: string
  categoria?: string
  prioridade?: string
  status?: string
  concluida?: boolean | null
  sortBy?: string
  sortOrder?: "asc" | "desc"
} = {}) {
  const {
    search = "",
    categoria = "",
    prioridade = "",
    status = "",
    concluida,
    sortBy = "updated_at",
    sortOrder = "desc",
  } = opts

  let q = sb().from("admin_notes").select("*")

  if (search) {
    q = q.or(`titulo.ilike.%${search}%,descricao.ilike.%${search}%`)
  }
  if (categoria) {
    q = q.eq("categoria", categoria)
  }
  if (prioridade) {
    q = q.eq("prioridade", prioridade)
  }
  if (status) {
    q = q.eq("status", status)
  }
  if (concluida !== null && concluida !== undefined) {
    q = q.eq("concluida", concluida)
  }

  const allowedSorts = ["created_at", "updated_at", "titulo", "data_limite", "prioridade"]
  const col = allowedSorts.includes(sortBy) ? sortBy : "updated_at"
  const dir = sortOrder === "asc" ? { ascending: true } : { ascending: false }

  q = q.order(col, dir)

  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}

export async function getNote(id: string) {
  const { data, error } = await sb().from("admin_notes").select("*").eq("id", id).single()
  if (error) throw new Error(error.message)
  return mapRow(data)
}

export async function createNote(formData: FormData) {
  const raw = Object.fromEntries(formData)

  const parsed = noteSchema.parse({
    titulo: raw.titulo,
    descricao: raw.descricao,
    categoria: raw.categoria || "geral",
    prioridade: raw.prioridade || "normal",
    status: raw.status || "pendente",
    data_limite: raw.data_limite || null,
    lembrete: raw.lembrete || null,
    concluida: raw.concluida === "true",
    cor: raw.cor || "",
  })

  const { data, error } = await sb()
    .from("admin_notes")
    .insert({
      ...parsed,
      data_limite: parsed.data_limite || null,
      lembrete: parsed.lembrete || null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath("/admin/anotacoes")
  return mapRow(data)
}

export async function updateNote(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData)

  const parsed = noteSchema.parse({
    titulo: raw.titulo,
    descricao: raw.descricao,
    categoria: raw.categoria || "geral",
    prioridade: raw.prioridade || "normal",
    status: raw.status || "pendente",
    data_limite: raw.data_limite || null,
    lembrete: raw.lembrete || null,
    concluida: raw.concluida === "true",
    cor: raw.cor || "",
  })

  const { data, error } = await sb()
    .from("admin_notes")
    .update({
      ...parsed,
      data_limite: parsed.data_limite || null,
      lembrete: parsed.lembrete || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath("/admin/anotacoes")
  return mapRow(data)
}

export async function toggleConcluida(id: string) {
  const { data: note } = await sb().from("admin_notes").select("concluida").eq("id", id).single()
  if (!note) throw new Error("Anotação não encontrada")
  const { error } = await sb()
    .from("admin_notes")
    .update({ concluida: !note.concluida, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/anotacoes")
}

export async function deleteNote(id: string) {
  const { error } = await sb().from("admin_notes").delete().eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/admin/anotacoes")
}

export async function getLembretesPendentes() {
  const { data, error } = await sb()
    .from("admin_notes")
    .select("*")
    .not("lembrete", "is", null)
    .lte("lembrete", new Date().toISOString())
    .eq("concluida", false)
    .order("lembrete", { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRow)
}
