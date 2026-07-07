"use server"

import { supabaseAdmin } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function resetSystem() {
  const sb = supabaseAdmin(process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data, error } = await sb.rpc("reset_system")

  if (error) {
    throw new Error(error.message || "Erro ao restaurar sistema")
  }

  revalidatePath("/admin")
  revalidatePath("/admin/configuracoes")
  revalidatePath("/admin/financeiro")
  revalidatePath("/admin/pedidos")
  revalidatePath("/admin/estoque")
  revalidatePath("/admin/relatorios")
  revalidatePath("/admin/nfe")
  revalidatePath("/admin/clientes")

  return { success: true, message: "Sistema restaurado com sucesso! Todos os dados operacionais foram removidos." }
}
